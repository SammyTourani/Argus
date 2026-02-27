/**
 * Streaming Markdown Utilities
 *
 * A lightweight module for handling streaming markdown rendering edge cases
 * that react-markdown does not handle well on its own:
 *
 *  - Unclosed fenced code blocks (```)
 *  - Unclosed inline code (`)
 *  - Unclosed bold/italic markers (* / ** / _ / __)
 *  - Partial link syntax [text](url
 *  - Partial image syntax ![alt](url
 *
 * Instead of pulling in a heavy `streamdown` dependency, these pure functions
 * process accumulated content and split it into "safe to render" vs "pending"
 * portions so the UI never flashes broken markdown.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface StreamingMarkdownConfig {
  enableCodeHighlighting: boolean;
  enableMath: boolean;
  enableDiagrams: boolean;
  theme: 'dark' | 'light';
}

export const DEFAULT_CONFIG: StreamingMarkdownConfig = {
  enableCodeHighlighting: true,
  enableMath: false,
  enableDiagrams: false,
  theme: 'dark',
};

// ---------------------------------------------------------------------------
// processStreamingChunk
// ---------------------------------------------------------------------------

export interface StreamingChunkResult {
  /** Content that is safe to render as markdown right now */
  safeContent: string;
  /** Content that might change with the next chunk (unclosed blocks) */
  pendingContent: string;
  /** True when a fenced code block (```) is open and not yet closed */
  hasUnclosedCodeBlock: boolean;
  /** True when an inline code span (`) is open and not yet closed */
  hasUnclosedInlineCode: boolean;
}

/**
 * Process a streaming chunk and split the accumulated content into a
 * "safe to render" portion and a "pending" tail that may still be
 * receiving data.
 *
 * @param accumulatedContent  All content received so far (before this chunk)
 * @param newChunk            The new chunk just received
 */
export function processStreamingChunk(
  accumulatedContent: string,
  newChunk: string,
): StreamingChunkResult {
  const full = accumulatedContent + newChunk;

  const hasUnclosedCodeBlock = hasOpenFencedCodeBlock(full);
  const hasUnclosedInlineCode = hasOpenInlineCode(full);

  // If we are inside a fenced code block, everything is "safe" — the
  // renderer should just display the raw text inside the fence.
  if (hasUnclosedCodeBlock) {
    return {
      safeContent: full,
      pendingContent: '',
      hasUnclosedCodeBlock: true,
      hasUnclosedInlineCode: false,
    };
  }

  // Find the last "structurally complete" boundary in the content.
  // We consider the end of the last fully-closed paragraph / block.
  const boundary = findSafeBoundary(full);

  if (boundary === full.length) {
    return {
      safeContent: full,
      pendingContent: '',
      hasUnclosedCodeBlock: false,
      hasUnclosedInlineCode,
    };
  }

  return {
    safeContent: full.slice(0, boundary),
    pendingContent: full.slice(boundary),
    hasUnclosedCodeBlock: false,
    hasUnclosedInlineCode,
  };
}

// ---------------------------------------------------------------------------
// finalizeMarkdown
// ---------------------------------------------------------------------------

/**
 * Close any unclosed markdown elements so the final render is clean.
 * Called once when the stream ends.
 */
export function finalizeMarkdown(content: string): string {
  let result = content;

  // Close unclosed fenced code blocks
  if (hasOpenFencedCodeBlock(result)) {
    result = result.trimEnd() + '\n```';
  }

  // Close unclosed inline code
  if (hasOpenInlineCode(result)) {
    result += '`';
  }

  // Close unclosed bold (**) / italic (*)
  result = closeUnclosedMarkers(result, '**');
  result = closeUnclosedMarkers(result, '__');
  result = closeUnclosedMarkers(result, '*');
  result = closeUnclosedMarkers(result, '_');

  // Close partial links: [text](url  → remove the broken link
  result = result.replace(/\[([^\]]*)\]\([^)]*$/g, '$1');

  // Close partial images: ![alt](url → remove the broken image
  result = result.replace(/!\[([^\]]*)\]\([^)]*$/g, '$1');

  // Close partial link text: [text → remove the bracket
  result = result.replace(/\[([^\]]*)$/g, '$1');

  return result;
}

// ---------------------------------------------------------------------------
// extractCodeBlocks
// ---------------------------------------------------------------------------

export interface CodeBlockInfo {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
  isComplete: boolean;
}

/**
 * Extract fenced code blocks with language info for syntax highlighting.
 * Works on both complete and in-progress (streaming) content.
 */
export function extractCodeBlocks(content: string): CodeBlockInfo[] {
  const blocks: CodeBlockInfo[] = [];
  const regex = /```(\w*)\n([\s\S]*?)(?:```|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const isComplete = fullMatch.endsWith('```');
    blocks.push({
      language: match[1] || 'text',
      code: match[2],
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
      isComplete,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check whether there is an unclosed fenced code block (```).
 * We count triple-backtick fences that sit at the start of a line.
 */
function hasOpenFencedCodeBlock(content: string): boolean {
  // Match ``` at the start of a line (or start of content)
  const fences = content.match(/^```/gm);
  if (!fences) return false;
  // Odd number of fences means one is still open
  return fences.length % 2 !== 0;
}

/**
 * Check whether there is an unclosed inline code span (`).
 * We only consider backticks that are NOT part of a fenced code block.
 */
function hasOpenInlineCode(content: string): boolean {
  // Strip fenced code blocks first so we don't count their backticks
  const stripped = content.replace(/```[\s\S]*?```/g, '');
  // Also strip already-closed inline code spans
  const withoutClosed = stripped.replace(/`[^`\n]+`/g, '');
  // Count remaining standalone backticks
  const remaining = withoutClosed.match(/`/g);
  if (!remaining) return false;
  return remaining.length % 2 !== 0;
}

/**
 * Find the last position in `content` where markdown is structurally
 * complete — i.e. no unclosed inline formatting markers or partial
 * links are trailing.
 *
 * Returns the length of the safe prefix.
 */
function findSafeBoundary(content: string): number {
  // Walk backwards from the end to find the last newline that is not
  // inside an unclosed inline element.  This is a pragmatic heuristic:
  // we split on the last double-newline (paragraph break) or the last
  // single newline that does not trail unclosed markers.

  // Fast path: if nothing is unclosed, the whole thing is safe.
  if (
    !hasOpenInlineCode(content) &&
    !hasUnclosedInlineFormatting(content) &&
    !hasPartialLink(content)
  ) {
    return content.length;
  }

  // Walk backwards looking for a newline where the prefix is clean.
  for (let i = content.length - 1; i >= 0; i--) {
    if (content[i] === '\n') {
      const prefix = content.slice(0, i + 1);
      if (
        !hasOpenInlineCode(prefix) &&
        !hasUnclosedInlineFormatting(prefix) &&
        !hasPartialLink(prefix)
      ) {
        return i + 1;
      }
    }
  }

  // Worst case: nothing is safe (very short content with partial marker)
  return 0;
}

/**
 * Detect unclosed bold/italic markers (* / ** / __ / _).
 * Only considers markers outside of fenced code blocks and inline code.
 */
function hasUnclosedInlineFormatting(content: string): boolean {
  // Strip code blocks and inline code
  let stripped = content.replace(/```[\s\S]*?```/g, '');
  stripped = stripped.replace(/`[^`\n]+`/g, '');

  // Check ** (bold)
  const boldDouble = stripped.match(/\*\*/g);
  if (boldDouble && boldDouble.length % 2 !== 0) return true;

  // Check __ (bold)
  const boldUnder = stripped.match(/__/g);
  if (boldUnder && boldUnder.length % 2 !== 0) return true;

  // After removing ** pairs, check remaining solo * (italic)
  const afterBold = stripped.replace(/\*\*/g, '');
  const italicStar = afterBold.match(/\*/g);
  if (italicStar && italicStar.length % 2 !== 0) return true;

  // After removing __ pairs, check remaining solo _ (italic)
  // Only count _ that is preceded/followed by whitespace or start/end (word boundary)
  const afterBoldUnder = stripped.replace(/__/g, '');
  const italicUnder = afterBoldUnder.match(/(?:^|[\s])_(?!_)|(?:^|[\s])_$/gm);
  if (italicUnder && italicUnder.length % 2 !== 0) return true;

  return false;
}

/**
 * Detect partial markdown links or images at the end of content.
 *  - [text](url     — opening paren, no closing
 *  - [text           — opening bracket, no closing
 *  - ![alt](url      — same for images
 */
function hasPartialLink(content: string): boolean {
  // Strip code blocks
  let stripped = content.replace(/```[\s\S]*?```/g, '');
  stripped = stripped.replace(/`[^`\n]+`/g, '');

  // Check for partial link/image at the very end
  if (/\[([^\]]*)\]\([^)]*$/.test(stripped)) return true;
  if (/!\[([^\]]*)\]\([^)]*$/.test(stripped)) return true;
  // Open bracket with no matching close at end of content
  if (/\[[^\]]*$/.test(stripped)) return true;

  return false;
}

/**
 * If a formatting marker (like ** or *) has an odd count, append one
 * more to close it.
 */
function closeUnclosedMarkers(content: string, marker: string): string {
  // Strip code blocks to avoid false positives
  const stripped = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '');

  // Escape the marker for regex
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = stripped.match(new RegExp(escaped, 'g'));

  if (matches && matches.length % 2 !== 0) {
    return content + marker;
  }

  return content;
}
