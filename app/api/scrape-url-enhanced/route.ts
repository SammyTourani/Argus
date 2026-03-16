import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { processHtml } from '@/lib/scrape/html-processor';

// Allow up to 60 seconds for heavy sites (Vercel Pro plan)
export const maxDuration = 60;

// Sanitize smart quotes and other problematic characters
function sanitizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00AB\u00BB]/g, '"')
    .replace(/[\u2039\u203A]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0]/g, ' ');
}

async function scrapeWithFirecrawl(url: string, apiKey: string, attempt: number = 1): Promise<any> {
  // First attempt: full formats with screenshot
  // Retry: simplified formats (no screenshot action, shorter wait)
  const isRetry = attempt > 1;

  const body: Record<string, any> = {
    url,
    formats: ['markdown', 'rawHtml', 'screenshot'],
    waitFor: isRetry ? 1000 : 2000,
    timeout: isRetry ? 45000 : 30000,
    blockAds: true,
    maxAge: 3600000,
  };

  // Only add actions on first attempt — they add overhead
  if (!isRetry) {
    body.actions = [
      { type: 'screenshot', fullPage: false },
    ];
  }

  console.log(`[scrape-url-enhanced] Attempt ${attempt} for ${url} (timeout: ${body.timeout}ms)`);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(55000), // Hard abort before Vercel kills us
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Try to parse as JSON to get a cleaner error message
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || errorJson.message || `Firecrawl error (${response.status})`);
    } catch {
      throw new Error(`Firecrawl error (${response.status}): ${errorText.slice(0, 200)}`);
    }
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    const errorMsg = data.error || 'Firecrawl returned no data';
    throw new Error(errorMsg);
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip, 'scrape');
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            'Retry-After': String(resetIn),
          },
        }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }

    console.log('[scrape-url-enhanced] Scraping with Firecrawl:', url);

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }

    // Try scraping with retry on timeout
    let data: any;
    try {
      data = await scrapeWithFirecrawl(url, FIRECRAWL_API_KEY, 1);
    } catch (firstError: any) {
      const isTimeout = firstError.message?.includes('SCRAPE_TIMEOUT') ||
                        firstError.message?.includes('timed out') ||
                        firstError.name === 'TimeoutError';

      if (isTimeout) {
        console.warn('[scrape-url-enhanced] First attempt timed out, retrying with simplified config...');
        try {
          data = await scrapeWithFirecrawl(url, FIRECRAWL_API_KEY, 2);
        } catch (retryError: any) {
          throw new Error(
            `Could not scrape this website — it may be too slow to load or blocking automated access. ` +
            `Try a different URL, or paste the website content directly.`
          );
        }
      } else {
        throw firstError;
      }
    }

    const { markdown, rawHtml, metadata, screenshot, actions } = data.data;

    // Get screenshot from either direct field or actions result
    const screenshotUrl = screenshot || actions?.screenshots?.[0] || null;

    // Sanitize the markdown content
    const sanitizedMarkdown = sanitizeQuotes(markdown || '');

    // Process HTML for structure, images, and fallback styles
    const processed = processHtml(rawHtml || '', url);

    // Extract structured data from the response
    const title = metadata?.title || '';
    const description = metadata?.description || '';

    // Format content for AI (text reference)
    const formattedContent = `
Title: ${sanitizeQuotes(title)}
Description: ${sanitizeQuotes(description)}
URL: ${url}

Main Content:
${sanitizedMarkdown}
    `.trim();

    return NextResponse.json({
      success: true,
      url,
      content: formattedContent,
      screenshot: screenshotUrl,
      html: processed.cleanHtml,
      structureSummary: processed.structureSummary,
      imageUrls: processed.imageUrls,
      branding: null, // branding is v2-only — use extracted styles as fallback
      styles: processed.styles,
      structured: {
        title: sanitizeQuotes(title),
        description: sanitizeQuotes(description),
        content: sanitizedMarkdown,
        url,
        screenshot: screenshotUrl,
      },
      metadata: {
        scraper: 'firecrawl-enhanced',
        timestamp: new Date().toISOString(),
        contentLength: formattedContent.length,
        cached: data.data.cached || false,
        hasBranding: false,
        hasRawHtml: !!rawHtml,
        imageCount: processed.imageUrls.length,
        ...metadata,
      },
    });

  } catch (error) {
    console.error('[scrape-url-enhanced] Error:', error);

    // Clean error message for the user — never dump raw JSON
    let userMessage = 'Failed to scrape website.';
    const errMsg = (error as Error).message || '';

    if (errMsg.includes('Could not scrape')) {
      userMessage = errMsg;
    } else if (errMsg.includes('SCRAPE_TIMEOUT') || errMsg.includes('timed out')) {
      userMessage = 'This website took too long to load. Try again, or try a different URL.';
    } else if (errMsg.includes('Rate limit')) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (errMsg.includes('not set')) {
      userMessage = 'Scraping service is not configured. Please contact support.';
    } else {
      userMessage = `Failed to scrape website: ${errMsg.slice(0, 200)}`;
    }

    return NextResponse.json({
      success: false,
      error: userMessage,
    }, { status: 500 });
  }
}
