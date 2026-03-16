/**
 * HTML Processor for clone pipeline.
 *
 * Provides:
 * - Cleaned HTML (scripts/iframes stripped, truncated to ~30KB)
 * - Structure summary (simplified DOM tree)
 * - Image URL extraction (resolved to absolute)
 * - Fallback style extraction (colors, fonts) — only used when Firecrawl branding is unavailable
 */

export interface ProcessedHtml {
  cleanHtml: string;
  structureSummary: string;
  imageUrls: string[];
  styles: {
    colors: string[];
    fonts: string[];
    fontSizes: string[];
  };
}

const MAX_HTML_LENGTH = 30_000; // ~30KB cap

/**
 * Process raw HTML for the clone pipeline.
 * Returns cleaned HTML, structure summary, image URLs, and fallback styles.
 */
export function processHtml(rawHtml: string, baseUrl: string): ProcessedHtml {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return {
      cleanHtml: '',
      structureSummary: '',
      imageUrls: [],
      styles: { colors: [], fonts: [], fontSizes: [] },
    };
  }

  const cleanHtml = cleanAndTruncateHtml(rawHtml);
  const imageUrls = extractImageUrls(rawHtml, baseUrl);
  const styles = extractStyles(rawHtml);
  const structureSummary = generateStructureSummary(rawHtml);

  return { cleanHtml, structureSummary, imageUrls, styles };
}

// ---------------------------------------------------------------------------
// HTML Cleaning
// ---------------------------------------------------------------------------

function cleanAndTruncateHtml(html: string): string {
  let cleaned = html;

  // Strip script, noscript, iframe tags and their contents
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  // Strip HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Collapse excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Truncate to cap
  if (cleaned.length > MAX_HTML_LENGTH) {
    // Try to cut at a tag boundary
    const cutPoint = cleaned.lastIndexOf('>', MAX_HTML_LENGTH);
    cleaned = cleaned.substring(0, cutPoint > MAX_HTML_LENGTH * 0.8 ? cutPoint + 1 : MAX_HTML_LENGTH);
    cleaned += '\n<!-- truncated -->';
  }

  return cleaned.trim();
}

// ---------------------------------------------------------------------------
// Image URL Extraction
// ---------------------------------------------------------------------------

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();

  // <img src="...">
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) urls.add(resolved);
  }

  // <img srcset="...">
  const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    // srcset has format: "url 1x, url 2x" — extract all urls
    const entries = match[1].split(',');
    for (const entry of entries) {
      const url = entry.trim().split(/\s+/)[0];
      if (url) {
        const resolved = resolveUrl(url, baseUrl);
        if (resolved) urls.add(resolved);
      }
    }
  }

  // CSS url(...) in inline styles and <style> blocks
  const cssUrlRegex = /url\(["']?([^"')]+)["']?\)/gi;
  while ((match = cssUrlRegex.exec(html)) !== null) {
    const val = match[1];
    if (val.startsWith('data:')) continue;
    if (/\.(png|jpe?g|gif|svg|webp|avif|ico)/i.test(val)) {
      const resolved = resolveUrl(val, baseUrl);
      if (resolved) urls.add(resolved);
    }
  }

  // <source srcset="..."> (for <picture>)
  const sourceSrcsetRegex = /<source[^>]+srcset=["']([^"']+)["']/gi;
  while ((match = sourceSrcsetRegex.exec(html)) !== null) {
    const entries = match[1].split(',');
    for (const entry of entries) {
      const url = entry.trim().split(/\s+/)[0];
      if (url) {
        const resolved = resolveUrl(url, baseUrl);
        if (resolved) urls.add(resolved);
      }
    }
  }

  return [...urls].filter(u => u.startsWith('http'));
}

function resolveUrl(url: string, baseUrl: string): string | null {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Style Extraction (fallback when Firecrawl branding is unavailable)
// ---------------------------------------------------------------------------

function extractStyles(html: string): ProcessedHtml['styles'] {
  // Extract colors
  const colorRegex = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi;
  const colorCounts = new Map<string, number>();
  let match;
  while ((match = colorRegex.exec(html)) !== null) {
    const color = match[0].toLowerCase();
    colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
  }
  // Sort by frequency, take top 20
  const colors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([c]) => c);

  // Extract font families
  const fontRegex = /font-family:\s*([^;}"]+)/gi;
  const fontSet = new Set<string>();
  while ((match = fontRegex.exec(html)) !== null) {
    const font = match[1].trim().replace(/["']/g, '');
    if (font && !font.includes('inherit') && !font.includes('unset')) {
      fontSet.add(font);
    }
  }

  // Extract font sizes
  const fontSizeRegex = /font-size:\s*([^;}"]+)/gi;
  const fontSizeSet = new Set<string>();
  while ((match = fontSizeRegex.exec(html)) !== null) {
    fontSizeSet.add(match[1].trim());
  }

  return {
    colors,
    fonts: [...fontSet],
    fontSizes: [...fontSizeSet],
  };
}

// ---------------------------------------------------------------------------
// Structure Summary
// ---------------------------------------------------------------------------

const SEMANTIC_TAGS = new Set([
  'header', 'nav', 'main', 'section', 'article', 'aside',
  'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'form',
  'ul', 'ol', 'table', 'figure', 'details',
]);

function generateStructureSummary(html: string): string {
  const lines: string[] = [];
  // Match opening tags of semantic elements
  const tagRegex = /<(header|nav|main|section|article|aside|footer|h[1-6]|form|ul|ol|table|figure|details)(\s[^>]*)?>/gi;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    // Extract class/id for context
    const attrs = match[2] || '';
    const classMatch = attrs.match(/class=["']([^"']+)["']/);
    const idMatch = attrs.match(/id=["']([^"']+)["']/);

    let desc = `<${tag}`;
    if (idMatch) desc += ` id="${idMatch[1]}"`;
    if (classMatch) {
      // Truncate long class lists
      const classes = classMatch[1].length > 60 ? classMatch[1].substring(0, 60) + '...' : classMatch[1];
      desc += ` class="${classes}"`;
    }
    desc += '>';
    lines.push(desc);
  }

  if (lines.length === 0) return 'No semantic structure detected';
  return lines.join('\n');
}
