/**
 * Lightweight token estimation utility.
 *
 * Uses character-based heuristics instead of a full tokenizer (tiktoken, etc.)
 * so there are zero external dependencies. The approximations are intentionally
 * conservative (slightly over-counting) so callers stay within budget rather
 * than accidentally exceeding it.
 *
 * Rule of thumb used here:
 *   - English prose:  ~4 characters per token
 *   - Source code:    ~3.5 characters per token (more symbols / short identifiers)
 *   - JSON / config:  ~3 characters per token
 *
 * The functions below pick a ratio based on a quick content-type sniff.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Rough content classification for picking a chars-per-token ratio. */
type ContentKind = 'code' | 'json' | 'prose';

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html', '.vue', '.svelte',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.swift',
]);

const CONFIG_EXTENSIONS = new Set([
  '.json', '.yaml', '.yml', '.toml', '.xml', '.env', '.ini',
]);

/**
 * Detect whether `text` looks like source code, JSON/config, or natural
 * language. The heuristic checks for common code tokens.
 */
function detectContentKind(text: string): ContentKind {
  // Quick length guard
  const sample = text.slice(0, 2000);

  // JSON detection (starts with { or [, or contains lots of colons + quotes)
  if (/^\s*[\[{]/.test(sample) && (sample.match(/"/g) || []).length > 10) {
    return 'json';
  }

  // Code detection: import/export statements, braces, semicolons, arrows
  const codeSignals = [
    /\bimport\s+/,
    /\bexport\s+(default\s+)?/,
    /\bfunction\s+\w/,
    /\bconst\s+\w/,
    /=>/,
    /\bclass\s+\w/,
    /\breturn\s/,
  ];
  const codeScore = codeSignals.reduce(
    (n, re) => n + (re.test(sample) ? 1 : 0),
    0,
  );
  if (codeScore >= 2) return 'code';

  return 'prose';
}

/** Chars-per-token ratio for each content kind. */
const RATIO: Record<ContentKind, number> = {
  prose: 4,
  code: 3.5,
  json: 3,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Estimate the number of tokens in a string.
 *
 * Uses a character-based heuristic that auto-detects whether the content is
 * prose, source code, or JSON/config and picks a conservative chars-per-token
 * ratio accordingly.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated token count (always >= 0, rounded up).
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;
  const kind = detectContentKind(text);
  return Math.ceil(text.length / RATIO[kind]);
}

/**
 * Estimate tokens for a file, optionally using the file path to improve the
 * content-kind detection (e.g. a `.json` file is definitely JSON).
 *
 * @param content  - The file content.
 * @param filePath - Optional file path used to refine the content-kind guess.
 * @returns Estimated token count.
 */
export function estimateFileTokens(content: string, filePath?: string): number {
  if (!content || content.length === 0) return 0;

  // If a file path is provided, use the extension to pick the ratio directly.
  if (filePath) {
    const ext = '.' + (filePath.split('.').pop() || '').toLowerCase();
    if (CONFIG_EXTENSIONS.has(ext)) {
      return Math.ceil(content.length / RATIO.json);
    }
    if (CODE_EXTENSIONS.has(ext)) {
      return Math.ceil(content.length / RATIO.code);
    }
  }

  // Fallback to auto-detection.
  return estimateTokens(content);
}

/**
 * Check whether `content` fits within a token budget.
 *
 * @param content - The text to check.
 * @param budget  - Maximum allowed tokens.
 * @returns `true` if estimated tokens <= budget.
 */
export function fitsInBudget(content: string, budget: number): boolean {
  return estimateTokens(content) <= budget;
}

/**
 * Truncate `content` so it fits within a token budget.
 *
 * Truncation is done at a character boundary derived from the budget and the
 * detected chars-per-token ratio. When truncation occurs the last line is
 * completed (not cut mid-line) and a trailing marker is appended.
 *
 * @param content - The text to potentially truncate.
 * @param budget  - Maximum allowed tokens.
 * @returns The (possibly truncated) text that fits within budget.
 */
export function truncateToFit(content: string, budget: number): string {
  if (!content || content.length === 0) return '';

  const kind = detectContentKind(content);
  const ratio = RATIO[kind];
  const maxChars = Math.floor(budget * ratio);

  if (content.length <= maxChars) return content;

  // Reserve a small amount for the truncation marker.
  const markerReserve = 60;
  let truncated = content.slice(0, maxChars - markerReserve);

  // Snap to the last newline so we don't cut a line in half.
  const lastNewline = truncated.lastIndexOf('\n');
  if (lastNewline > truncated.length * 0.8) {
    truncated = truncated.slice(0, lastNewline);
  }

  return truncated + '\n// ... [truncated to fit token budget]';
}
