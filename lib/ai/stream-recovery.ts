/**
 * StreamRecoveryManager — buffers streamed text chunks, detects truncation,
 * and provides checkpoint-based recovery for Vercel AI SDK `streamText()` results.
 *
 * Designed to wrap the text stream so that if a connection drops or the AI
 * hits token limits mid-file, we can detect it and retry from the last good
 * checkpoint rather than losing all progress.
 */

export interface StreamCheckpoint {
  /** Byte-offset into the buffer at the time the checkpoint was created */
  position: number;
  /** Unix timestamp (ms) when the checkpoint was taken */
  timestamp: number;
  /** Optional label for debugging (e.g. "after-file-close:Hero.jsx") */
  label?: string;
}

export interface RecoveryContent {
  /** The buffered content from the last checkpoint to the end */
  content: string;
  /** The buffer position the recovery content starts from */
  position: number;
  /** Total buffered length at the time of recovery */
  totalLength: number;
}

export interface TruncationInfo {
  isTruncated: boolean;
  reasons: string[];
}

export class StreamRecoveryManager {
  private buffer: string = '';
  private checkpoints: StreamCheckpoint[] = [];
  private lastChunkTimestamp: number = 0;
  private chunkCount: number = 0;
  private streamStartTime: number = 0;
  private isStreamActive: boolean = false;

  /** Maximum number of checkpoints to retain (oldest are pruned) */
  private maxCheckpoints: number;

  /** Interval (in characters) at which auto-checkpoints are created */
  private autoCheckpointInterval: number;

  /** Characters since last auto-checkpoint */
  private charsSinceCheckpoint: number = 0;

  constructor(options?: {
    maxCheckpoints?: number;
    autoCheckpointInterval?: number;
  }) {
    this.maxCheckpoints = options?.maxCheckpoints ?? 50;
    this.autoCheckpointInterval = options?.autoCheckpointInterval ?? 2000;
  }

  // ---------------------------------------------------------------------------
  // Core API
  // ---------------------------------------------------------------------------

  /**
   * Called for each text chunk arriving from the stream.
   * Buffers the chunk, updates timing metadata, and creates auto-checkpoints
   * at natural boundaries (closing `</file>` tags, blank lines, etc.).
   */
  onChunk(chunk: string): void {
    if (!this.isStreamActive) {
      this.isStreamActive = true;
      this.streamStartTime = Date.now();
    }

    this.buffer += chunk;
    this.lastChunkTimestamp = Date.now();
    this.chunkCount++;
    this.charsSinceCheckpoint += chunk.length;

    // Auto-checkpoint at natural boundaries when we've accumulated enough text
    if (this.charsSinceCheckpoint >= this.autoCheckpointInterval) {
      // Prefer checkpointing right after a </file> close tag
      const lastFileClose = this.buffer.lastIndexOf('</file>');
      if (lastFileClose !== -1 && lastFileClose > (this.getLastCheckpointPosition())) {
        this.checkpoint(lastFileClose + '</file>'.length, 'auto:file-close');
      } else {
        // Fall back to checkpointing at the last newline boundary
        const lastNewline = this.buffer.lastIndexOf('\n');
        if (lastNewline > this.getLastCheckpointPosition()) {
          this.checkpoint(lastNewline + 1, 'auto:newline');
        } else {
          this.checkpoint(this.buffer.length, 'auto:interval');
        }
      }
    }
  }

  /** Get the full buffered content accumulated so far */
  getBufferedContent(): string {
    return this.buffer;
  }

  /** Get content from the last checkpoint for use in a retry/continuation prompt */
  getRecoveryContent(): RecoveryContent {
    const lastCp = this.checkpoints.length > 0
      ? this.checkpoints[this.checkpoints.length - 1]
      : { position: 0, timestamp: this.streamStartTime };

    return {
      content: this.buffer.slice(lastCp.position),
      position: lastCp.position,
      totalLength: this.buffer.length,
    };
  }

  /**
   * Get the content that was successfully completed (up to the last checkpoint).
   * Useful when you want to keep only the "known good" portion.
   */
  getCompletedContent(): string {
    if (this.checkpoints.length === 0) return '';
    const lastCp = this.checkpoints[this.checkpoints.length - 1];
    return this.buffer.slice(0, lastCp.position);
  }

  /**
   * Create a checkpoint at the given position (defaults to current buffer end).
   */
  checkpoint(position?: number, label?: string): void {
    const cp: StreamCheckpoint = {
      position: position ?? this.buffer.length,
      timestamp: Date.now(),
      label,
    };
    this.checkpoints.push(cp);
    this.charsSinceCheckpoint = this.buffer.length - cp.position;

    // Prune old checkpoints if we exceed the limit
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints = this.checkpoints.slice(-this.maxCheckpoints);
    }
  }

  /** Reset all state for a new stream */
  reset(): void {
    this.buffer = '';
    this.checkpoints = [];
    this.lastChunkTimestamp = 0;
    this.chunkCount = 0;
    this.streamStartTime = 0;
    this.isStreamActive = false;
    this.charsSinceCheckpoint = 0;
  }

  // ---------------------------------------------------------------------------
  // Truncation detection
  // ---------------------------------------------------------------------------

  /**
   * Detect whether the buffered content appears truncated.
   *
   * Checks for:
   * - Unclosed `<file path="...">` tags (Argus code-gen format)
   * - Unclosed `<boltAction>` / `<boltArtifact>` tags (bolt.diy compat)
   * - Unclosed triple-backtick code blocks
   * - Unclosed HTML/JSX tags in the tail of the content
   * - Content ending mid-line (no trailing newline after significant content)
   * - Severely unmatched braces in the trailing portion
   */
  isTruncated(): boolean {
    return this.getTruncationInfo().isTruncated;
  }

  /**
   * Detailed truncation analysis — returns structured info about *why*
   * the content is considered truncated.
   */
  getTruncationInfo(): TruncationInfo {
    const reasons: string[] = [];
    const content = this.buffer;

    if (content.length === 0) {
      return { isTruncated: false, reasons: [] };
    }

    // 1. Unclosed <file> tags
    const fileOpens = (content.match(/<file\s+path="[^"]*">/g) || []).length;
    const fileCloses = (content.match(/<\/file>/g) || []).length;
    if (fileOpens > fileCloses) {
      reasons.push(`Unclosed <file> tags: ${fileOpens} opened, ${fileCloses} closed`);
    }

    // 2. Unclosed <boltAction> / <boltArtifact> tags
    const boltActionOpens = (content.match(/<boltAction\b[^>]*>/g) || []).length;
    const boltActionCloses = (content.match(/<\/boltAction>/g) || []).length;
    if (boltActionOpens > boltActionCloses) {
      reasons.push(`Unclosed <boltAction> tags: ${boltActionOpens} opened, ${boltActionCloses} closed`);
    }

    const boltArtifactOpens = (content.match(/<boltArtifact\b[^>]*>/g) || []).length;
    const boltArtifactCloses = (content.match(/<\/boltArtifact>/g) || []).length;
    if (boltArtifactOpens > boltArtifactCloses) {
      reasons.push(`Unclosed <boltArtifact> tags: ${boltArtifactOpens} opened, ${boltArtifactCloses} closed`);
    }

    // 3. Unclosed code blocks (triple backticks)
    const backtickMatches = content.match(/```/g) || [];
    if (backtickMatches.length % 2 !== 0) {
      reasons.push('Unclosed code block (odd number of triple backticks)');
    }

    // 4. Content ends mid-tag (partial opening or closing tag at the very end)
    const tail = content.slice(-100);
    if (/<[a-zA-Z][^>]*$/.test(tail) && !tail.endsWith('>')) {
      reasons.push('Content ends with an incomplete/unclosed HTML tag');
    }
    if (/<\/[a-zA-Z]*$/.test(tail)) {
      reasons.push('Content ends with a partial closing tag');
    }

    // 5. Content ends mid-string literal (odd number of unescaped quotes in the last line)
    const lastLine = content.split('\n').pop() || '';
    if (lastLine.length > 0) {
      const singleQuotes = (lastLine.match(/(?<!\\)'/g) || []).length;
      const doubleQuotes = (lastLine.match(/(?<!\\)"/g) || []).length;
      const backticks = (lastLine.match(/(?<!\\)`/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        // Only flag if this looks like code (not natural language)
        if (/<file|import |export |function |const |let |var |return /.test(content.slice(-500))) {
          reasons.push('Content appears to end mid-string (unmatched quotes on last line)');
        }
      }
    }

    // 6. Severely unmatched braces in the trailing portion (last 2000 chars)
    //    We only look at the tail to avoid false positives from template literals, etc.
    const trailingContent = content.slice(-2000);
    const openBraces = (trailingContent.match(/{/g) || []).length;
    const closeBraces = (trailingContent.match(/}/g) || []).length;
    if (openBraces > closeBraces + 3) {
      reasons.push(`Severely unmatched braces in trailing content: ${openBraces} open vs ${closeBraces} close`);
    }

    // 7. Content ends mid-word (no whitespace, newline, or punctuation at the end)
    const trimmed = content.trimEnd();
    if (trimmed.length > 0) {
      const lastChar = trimmed[trimmed.length - 1];
      const endsCleanly = /[;\n\r}>)\]"'`\s.]/.test(lastChar);
      if (!endsCleanly && trimmed.length > 100) {
        reasons.push('Content appears to end mid-word or mid-expression');
      }
    }

    return {
      isTruncated: reasons.length > 0,
      reasons,
    };
  }

  // ---------------------------------------------------------------------------
  // Metadata / Diagnostics
  // ---------------------------------------------------------------------------

  /** Number of chunks received so far */
  getChunkCount(): number {
    return this.chunkCount;
  }

  /** Milliseconds since the last chunk was received */
  getTimeSinceLastChunk(): number {
    if (this.lastChunkTimestamp === 0) return 0;
    return Date.now() - this.lastChunkTimestamp;
  }

  /** Total time the stream has been active (ms) */
  getStreamDuration(): number {
    if (this.streamStartTime === 0) return 0;
    return Date.now() - this.streamStartTime;
  }

  /** Current buffer length in characters */
  getBufferLength(): number {
    return this.buffer.length;
  }

  /** Get all checkpoints (read-only snapshot) */
  getCheckpoints(): ReadonlyArray<StreamCheckpoint> {
    return [...this.checkpoints];
  }

  /** Whether the stream is currently receiving data */
  getIsStreamActive(): boolean {
    return this.isStreamActive;
  }

  /** Mark the stream as ended (called when the stream closes) */
  markStreamEnded(): void {
    this.isStreamActive = false;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getLastCheckpointPosition(): number {
    if (this.checkpoints.length === 0) return 0;
    return this.checkpoints[this.checkpoints.length - 1].position;
  }
}
