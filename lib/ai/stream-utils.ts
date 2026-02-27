/**
 * Stream utility functions for truncation detection, continuation prompt
 * building, and file-operation extraction from AI-generated streaming content.
 *
 * These are pure functions with no side-effects, designed to be used by
 * StreamRecoveryManager, SwitchableStream, and the route handler.
 */

// ---------------------------------------------------------------------------
// Truncation detection
// ---------------------------------------------------------------------------

export type TruncationType =
  | 'unclosed-tag'
  | 'unclosed-code-block'
  | 'unclosed-brace'
  | 'mid-line'
  | 'mid-string'
  | 'none';

export interface TruncationResult {
  isTruncated: boolean;
  /** The most significant truncation type detected */
  truncationType: TruncationType;
  /** All truncation types found (there may be multiple) */
  allTypes: TruncationType[];
  /** Position of the last content that appears structurally complete */
  lastCompletePosition: number;
  /** Human-readable reasons */
  reasons: string[];
}

/**
 * Detect common truncation patterns in AI-generated streaming content.
 *
 * Works with the `<file path="...">...</file>` format used by Argus,
 * as well as `<boltAction>` / `<boltArtifact>` tags from bolt.diy.
 */
export function detectTruncation(content: string): TruncationResult {
  const reasons: string[] = [];
  const allTypes: TruncationType[] = [];
  let lastCompletePosition = 0;

  if (!content || content.length === 0) {
    return {
      isTruncated: false,
      truncationType: 'none',
      allTypes: [],
      lastCompletePosition: 0,
      reasons: [],
    };
  }

  // --- 1. Unclosed XML-style tags ---

  // <file> tags (Argus format)
  const fileOpenPositions = findAllPositions(content, /<file\s+path="[^"]*">/g);
  const fileClosePositions = findAllPositions(content, /<\/file>/g);
  if (fileOpenPositions.length > fileClosePositions.length) {
    reasons.push(
      `Unclosed <file> tags: ${fileOpenPositions.length} opened, ${fileClosePositions.length} closed`,
    );
    allTypes.push('unclosed-tag');

    // Last complete position is right after the last </file>
    if (fileClosePositions.length > 0) {
      const lastClose = fileClosePositions[fileClosePositions.length - 1];
      lastCompletePosition = Math.max(lastCompletePosition, lastClose + '</file>'.length);
    }
  } else if (fileClosePositions.length > 0) {
    const lastClose = fileClosePositions[fileClosePositions.length - 1];
    lastCompletePosition = Math.max(lastCompletePosition, lastClose + '</file>'.length);
  }

  // <boltAction> tags
  const boltActionOpens = (content.match(/<boltAction\b[^>]*>/g) || []).length;
  const boltActionCloses = (content.match(/<\/boltAction>/g) || []).length;
  if (boltActionOpens > boltActionCloses) {
    reasons.push(
      `Unclosed <boltAction> tags: ${boltActionOpens} opened, ${boltActionCloses} closed`,
    );
    allTypes.push('unclosed-tag');
  }

  // <boltArtifact> tags
  const boltArtifactOpens = (content.match(/<boltArtifact\b[^>]*>/g) || []).length;
  const boltArtifactCloses = (content.match(/<\/boltArtifact>/g) || []).length;
  if (boltArtifactOpens > boltArtifactCloses) {
    reasons.push(
      `Unclosed <boltArtifact> tags: ${boltArtifactOpens} opened, ${boltArtifactCloses} closed`,
    );
    allTypes.push('unclosed-tag');
  }

  // <edit> tags (Morph fast-apply format)
  const editOpens = (content.match(/<edit\b[^>]*>/g) || []).length;
  const editCloses = (content.match(/<\/edit>/g) || []).length;
  if (editOpens > editCloses) {
    reasons.push(`Unclosed <edit> tags: ${editOpens} opened, ${editCloses} closed`);
    allTypes.push('unclosed-tag');
  }

  // --- 2. Unclosed code blocks (triple backticks) ---
  const backtickCount = (content.match(/```/g) || []).length;
  if (backtickCount % 2 !== 0) {
    reasons.push('Unclosed code block (odd number of ``` delimiters)');
    allTypes.push('unclosed-code-block');

    // Find last complete code block boundary
    const backtickPositions = findAllPositions(content, /```/g);
    if (backtickPositions.length >= 2) {
      // The last complete pair ends at the second-to-last backtick
      const lastCompletePair = backtickPositions[backtickPositions.length - 2];
      lastCompletePosition = Math.max(lastCompletePosition, lastCompletePair + 3);
    }
  }

  // --- 3. Severely unmatched braces in code sections ---
  // Only consider content that looks like code (within <file> blocks)
  const codeContent = extractCodeContent(content);
  if (codeContent.length > 100) {
    const openBraces = (codeContent.match(/{/g) || []).length;
    const closeBraces = (codeContent.match(/}/g) || []).length;
    if (openBraces > closeBraces + 3) {
      reasons.push(
        `Severely unmatched braces in code: ${openBraces} open vs ${closeBraces} close`,
      );
      allTypes.push('unclosed-brace');
    }
  }

  // --- 4. Content ends mid-string ---
  const lastLine = content.split('\n').pop() || '';
  if (lastLine.length > 0 && looksLikeCode(content.slice(-500))) {
    const singleQuotes = (lastLine.match(/(?<!\\)'/g) || []).length;
    const doubleQuotes = (lastLine.match(/(?<!\\)"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      reasons.push('Content ends mid-string literal');
      allTypes.push('mid-string');
    }
  }

  // --- 5. Content ends mid-line ---
  const trimmed = content.trimEnd();
  if (trimmed.length > 100) {
    const lastChar = trimmed[trimmed.length - 1];
    // Content should end with a "natural" terminator
    const endsCleanly = /[;\n\r}>)\]"'`\s.]/.test(lastChar);
    if (!endsCleanly) {
      reasons.push('Content appears to end mid-line or mid-expression');
      allTypes.push('mid-line');
    }
  }

  // Determine the primary truncation type (most severe)
  const typePriority: TruncationType[] = [
    'unclosed-tag',
    'unclosed-code-block',
    'unclosed-brace',
    'mid-string',
    'mid-line',
  ];
  const primaryType = typePriority.find((t) => allTypes.includes(t)) ?? 'none';

  // If no truncation found, set lastCompletePosition to end of content
  if (allTypes.length === 0) {
    lastCompletePosition = content.length;
  }

  return {
    isTruncated: allTypes.length > 0,
    truncationType: primaryType,
    allTypes: Array.from(new Set(allTypes)),
    lastCompletePosition,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Continuation prompt building
// ---------------------------------------------------------------------------

/**
 * Build a continuation prompt that includes enough trailing context from the
 * buffered content for the AI to seamlessly resume where it left off.
 *
 * @param bufferedContent - The full buffered content so far
 * @param contextChars - Number of trailing characters to include as context (default: 800)
 */
export function buildContinuationPrompt(
  bufferedContent: string,
  contextChars: number = 800,
): string {
  if (!bufferedContent || bufferedContent.length === 0) {
    return 'Continue generating the code. Start from the beginning.';
  }

  // Get the trailing context
  const trailingContext = bufferedContent.slice(-contextChars);

  // Detect what kind of content was being generated
  const truncation = detectTruncation(bufferedContent);
  let contextHint = '';

  if (truncation.truncationType === 'unclosed-tag') {
    // Find which tag is unclosed
    const fileOpens = (bufferedContent.match(/<file\s+path="([^"]*)">/g) || []);
    if (fileOpens.length > 0) {
      const lastFileOpen = fileOpens[fileOpens.length - 1];
      const pathMatch = lastFileOpen.match(/path="([^"]*)"/);
      const filePath = pathMatch ? pathMatch[1] : 'unknown';
      contextHint = `\nYou were generating the file "${filePath}" and did not finish it. Complete this file and any remaining files.`;
    }
  } else if (truncation.truncationType === 'unclosed-code-block') {
    contextHint = '\nYou were in the middle of a code block. Close it and continue.';
  } else if (truncation.truncationType === 'unclosed-brace') {
    contextHint = '\nYou have unclosed braces/brackets. Close them properly and continue.';
  }

  return [
    'Continue your prior response. IMPORTANT: Immediately begin from where you left off without any interruptions.',
    'Do not repeat any content that has already been generated.',
    'Do not add any preamble, commentary, or explanation.',
    contextHint,
    '',
    'Here is the end of what you have generated so far (continue EXACTLY from this point):',
    '',
    '---CONTEXT START---',
    trailingContext,
    '---CONTEXT END---',
    '',
    'Continue from exactly where the context ends. Do not repeat any of it.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// File operation extraction
// ---------------------------------------------------------------------------

export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  filePath: string;
  content: string;
  /** Whether the file block has a proper closing tag */
  isComplete: boolean;
}

/**
 * Parse `<file path="...">...</file>` blocks and `<edit>` blocks from
 * streaming AI output. Handles both complete and incomplete (truncated) blocks.
 *
 * For `<file>` blocks: extracts create/update operations.
 * For `<edit>` blocks: extracts update operations (Morph fast-apply format).
 *
 * This mirrors the logic in `parse-files.ts` but adds the `isComplete` flag
 * and classifies operations by type.
 */
export function extractFileOperations(streamContent: string): FileOperation[] {
  const operations: FileOperation[] = [];
  const seen = new Map<string, number>(); // path -> index in operations[]

  // --- Parse <file> blocks ---
  const FILE_OPEN = '<file path="';
  const FILE_CLOSE = '</file>';

  let cursor = 0;
  while (cursor < streamContent.length) {
    const openStart = streamContent.indexOf(FILE_OPEN, cursor);
    if (openStart === -1) break;

    const pathStart = openStart + FILE_OPEN.length;
    const pathEnd = streamContent.indexOf('">', pathStart);
    if (pathEnd === -1) {
      // Malformed or truncated opening tag
      cursor = pathStart;
      break;
    }

    const filePath = streamContent.substring(pathStart, pathEnd);
    if (!filePath) {
      cursor = pathEnd + 2;
      continue;
    }

    const contentStart = pathEnd + 2; // skip past `">`

    // Find the matching closing tag, respecting nesting
    let depth = 1;
    let scanPos = contentStart;
    let closePos = -1;

    while (scanPos < streamContent.length && depth > 0) {
      const nextOpen = streamContent.indexOf(FILE_OPEN, scanPos);
      const nextClose = streamContent.indexOf(FILE_CLOSE, scanPos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        scanPos = nextOpen + FILE_OPEN.length;
      } else {
        depth--;
        if (depth === 0) {
          closePos = nextClose;
        }
        scanPos = nextClose + FILE_CLOSE.length;
      }
    }

    const hasClosingTag = closePos !== -1;
    const content = hasClosingTag
      ? streamContent.substring(contentStart, closePos).trim()
      : streamContent.substring(contentStart).trim();

    const op: FileOperation = {
      type: 'create', // We can't distinguish create vs update without filesystem context
      filePath,
      content,
      isComplete: hasClosingTag,
    };

    // De-duplicate: prefer the longest complete version
    const existingIdx = seen.get(filePath);
    if (existingIdx !== undefined) {
      const existing = operations[existingIdx];
      const shouldReplace =
        (!existing.isComplete && hasClosingTag) ||
        (existing.isComplete === hasClosingTag && content.length > existing.content.length);
      if (shouldReplace) {
        operations[existingIdx] = op;
      }
    } else {
      seen.set(filePath, operations.length);
      operations.push(op);
    }

    cursor = hasClosingTag ? closePos + FILE_CLOSE.length : streamContent.length;
  }

  // --- Parse <edit> blocks (Morph fast-apply) ---
  const editRegex = /<edit\s+target_file="([^"]*)">([\s\S]*?)<\/edit>/g;
  let editMatch;
  while ((editMatch = editRegex.exec(streamContent)) !== null) {
    const filePath = editMatch[1];
    const editContent = editMatch[2].trim();

    operations.push({
      type: 'update',
      filePath,
      content: editContent,
      isComplete: true,
    });
  }

  // Also detect incomplete <edit> blocks (truncated before closing tag)
  const incompleteEditRegex = /<edit\s+target_file="([^"]*)">([\s\S]*)$/g;
  let incompleteMatch;
  while ((incompleteMatch = incompleteEditRegex.exec(streamContent)) !== null) {
    const filePath = incompleteMatch[1];
    // Only add if we haven't already captured a complete version
    const alreadyCaptured = operations.some(
      (op) => op.filePath === filePath && op.type === 'update' && op.isComplete,
    );
    if (!alreadyCaptured && !streamContent.includes(`</edit>`)) {
      operations.push({
        type: 'update',
        filePath,
        content: incompleteMatch[2].trim(),
        isComplete: false,
      });
    }
  }

  return operations;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Find all match positions for a regex in a string.
 */
function findAllPositions(str: string, regex: RegExp): number[] {
  const positions: number[] = [];
  let match;
  // Ensure the regex is global
  const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((match = globalRegex.exec(str)) !== null) {
    positions.push(match.index);
  }
  return positions;
}

/**
 * Extract content that's inside `<file>` blocks (i.e., actual code).
 */
function extractCodeContent(content: string): string {
  const blocks: string[] = [];
  const regex = /<file\s+path="[^"]*">([\s\S]*?)<\/file>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  return blocks.join('\n');
}

/**
 * Heuristic: does this text look like code rather than natural language?
 */
function looksLikeCode(text: string): boolean {
  return /<file|import |export |function |const |let |var |return |class /.test(text);
}
