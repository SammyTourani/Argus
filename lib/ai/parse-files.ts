/**
 * Robust parser for AI-generated code responses that use the
 * `<file path="...">...</file>` XML-like format.
 *
 * Replaces the fragile regex `/<file path="([^"]+)">([^]*?)<\/file>/g`
 * which could not handle:
 *  - Content containing literal `</file>` strings
 *  - Escaped characters
 *  - Truncated / missing closing tags
 *  - Duplicate files (keeps the longest complete version)
 */

export interface ParsedFile {
  path: string;
  content: string;
}

/**
 * Parse `<file path="...">...</file>` blocks from an AI response string.
 *
 * Strategy: use indexOf-based scanning instead of a single regex so we can
 * correctly handle edge-cases (nested angle-brackets, content that looks like
 * a closing tag, etc.).
 */
export function parseGeneratedFiles(response: string): ParsedFile[] {
  const fileMap = new Map<string, { content: string; isComplete: boolean }>();

  const OPEN_TAG = '<file path="';
  const CLOSE_TAG = '</file>';

  let cursor = 0;

  while (cursor < response.length) {
    // Find next opening tag
    const openStart = response.indexOf(OPEN_TAG, cursor);
    if (openStart === -1) break;

    // Extract the path attribute
    const pathStart = openStart + OPEN_TAG.length;
    const pathEnd = response.indexOf('">', pathStart);
    if (pathEnd === -1) {
      // Malformed — no closing `">`, skip past the tag start
      cursor = pathStart;
      continue;
    }

    const filePath = response.substring(pathStart, pathEnd);
    if (!filePath) {
      cursor = pathEnd + 2;
      continue;
    }

    const contentStart = pathEnd + 2; // skip past `">`

    // Find the matching closing tag. We want the FIRST `</file>` that
    // isn't itself inside another `<file ...>` block.
    // Simple approach: scan forward for `</file>` while counting nested opens.
    let depth = 1;
    let scanPos = contentStart;
    let closePos = -1;

    while (scanPos < response.length && depth > 0) {
      const nextOpen = response.indexOf(OPEN_TAG, scanPos);
      const nextClose = response.indexOf(CLOSE_TAG, scanPos);

      if (nextClose === -1) {
        // No closing tag found — treat rest of string as content (truncated)
        break;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Nested <file> tag — increase depth
        depth++;
        scanPos = nextOpen + OPEN_TAG.length;
      } else {
        depth--;
        if (depth === 0) {
          closePos = nextClose;
        }
        scanPos = nextClose + CLOSE_TAG.length;
      }
    }

    const hasClosingTag = closePos !== -1;
    const content = hasClosingTag
      ? response.substring(contentStart, closePos).trim()
      : response.substring(contentStart).trim();

    // De-duplicate: prefer the longest complete version
    const existing = fileMap.get(filePath);
    let shouldReplace = false;

    if (!existing) {
      shouldReplace = true;
    } else if (!existing.isComplete && hasClosingTag) {
      shouldReplace = true;
    } else if (existing.isComplete && hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true;
    } else if (!existing.isComplete && !hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true;
    }

    if (shouldReplace) {
      fileMap.set(filePath, { content, isComplete: hasClosingTag });
    }

    // Advance cursor past the consumed block
    cursor = hasClosingTag ? closePos + CLOSE_TAG.length : response.length;
  }

  const result: ParsedFile[] = [];
  for (const [path, { content }] of fileMap.entries()) {
    result.push({ path, content });
  }

  return result;
}
