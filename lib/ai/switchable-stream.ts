/**
 * SwitchableStream — wraps a ReadableStream<Uint8Array> from Vercel AI SDK's
 * `streamText()` result and automatically continues the AI response when the
 * stream ends but the content appears truncated.
 *
 * The consumer reads from a single unified ReadableStream. Internally, when
 * the original stream closes and truncation is detected, SwitchableStream:
 *   1. Calls the provided `onContinuationNeeded` callback to get a new stream
 *      (the caller is responsible for making the actual `streamText()` call
 *       with the CONTINUE_PROMPT).
 *   2. Seamlessly pipes the new stream into the same readable output.
 *   3. Repeats up to `maxContinuations` times to prevent infinite loops.
 */

import { StreamRecoveryManager } from './stream-recovery';

/**
 * The prompt sent to the AI when a continuation is needed.
 * Designed to make the model resume exactly where it left off without
 * repeating content or adding preamble.
 */
export const CONTINUE_PROMPT =
  'Continue your prior response. IMPORTANT: Immediately begin from where you left off without any interruptions. Do not repeat any content that has already been said. Do not add any preamble or commentary.';

export interface SwitchableStreamOptions {
  /** Maximum number of auto-continuations before giving up. Default: 3 */
  maxContinuations?: number;

  /**
   * Callback invoked when the stream ends but content is truncated.
   * Must return a new ReadableStream<Uint8Array> (e.g. from a fresh
   * `streamText()` call with `CONTINUE_PROMPT`).
   *
   * Receives the buffered content so far and the continuation index.
   * If not provided, auto-continue is disabled and the stream just ends.
   */
  onContinuationNeeded?: (
    bufferedContent: string,
    continuationIndex: number,
  ) => Promise<ReadableStream<Uint8Array>>;

  /**
   * Optional callback fired whenever a continuation starts.
   * Useful for sending progress/status updates to the client.
   */
  onContinuationStart?: (index: number) => void;

  /**
   * Optional callback fired when all continuations are exhausted
   * but the content is still truncated.
   */
  onContinuationsExhausted?: (totalAttempts: number) => void;

  /** StreamRecoveryManager options forwarded to the internal instance */
  recoveryManagerOptions?: {
    maxCheckpoints?: number;
    autoCheckpointInterval?: number;
  };
}

export class SwitchableStream {
  private currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private continuationCount: number = 0;
  private maxContinuations: number;
  private recoveryManager: StreamRecoveryManager;
  private onContinuationNeeded?: SwitchableStreamOptions['onContinuationNeeded'];
  private onContinuationStart?: SwitchableStreamOptions['onContinuationStart'];
  private onContinuationsExhausted?: SwitchableStreamOptions['onContinuationsExhausted'];
  private outputController: ReadableStreamDefaultController<Uint8Array> | null = null;
  private isClosed: boolean = false;
  private decoder: TextDecoder;
  private outputStream: ReadableStream<Uint8Array>;

  constructor(
    initialStream: ReadableStream<Uint8Array>,
    options?: SwitchableStreamOptions,
  ) {
    this.maxContinuations = options?.maxContinuations ?? 3;
    this.onContinuationNeeded = options?.onContinuationNeeded;
    this.onContinuationStart = options?.onContinuationStart;
    this.onContinuationsExhausted = options?.onContinuationsExhausted;
    this.recoveryManager = new StreamRecoveryManager(options?.recoveryManagerOptions);
    this.decoder = new TextDecoder();

    // Create the unified output stream that the consumer will read from
    this.outputStream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.outputController = controller;
        // Begin pumping the initial stream
        this.currentReader = initialStream.getReader();
        this.pump();
      },
      cancel: () => {
        this.isClosed = true;
        this.currentReader?.cancel();
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Get the unified readable stream. This is what the consumer should read from. */
  getReadableStream(): ReadableStream<Uint8Array> {
    return this.outputStream;
  }

  /**
   * Manually switch to a new stream (e.g. a continuation stream).
   * The previous reader is released and the new stream is pumped into
   * the same output.
   */
  switchTo(newStream: ReadableStream<Uint8Array>): void {
    // Release the old reader
    this.currentReader?.cancel().catch(() => {});
    this.currentReader = newStream.getReader();
    this.pump();
  }

  /**
   * Check if auto-continue is needed based on the current buffer state.
   * Returns true if the content appears truncated and we haven't exhausted
   * our continuation budget.
   */
  needsContinuation(): boolean {
    return (
      this.recoveryManager.isTruncated() &&
      this.continuationCount < this.maxContinuations
    );
  }

  /** Get the underlying StreamRecoveryManager for direct access */
  getRecoveryManager(): StreamRecoveryManager {
    return this.recoveryManager;
  }

  /** How many continuations have been performed so far */
  getContinuationCount(): number {
    return this.continuationCount;
  }

  // ---------------------------------------------------------------------------
  // Internal pump loop
  // ---------------------------------------------------------------------------

  private async pump(): Promise<void> {
    if (!this.currentReader || !this.outputController || this.isClosed) return;

    try {
      while (true) {
        const { done, value } = await this.currentReader.read();

        if (done) {
          // Stream ended — check if we need to continue
          this.recoveryManager.markStreamEnded();

          const shouldContinue =
            this.onContinuationNeeded &&
            this.continuationCount < this.maxContinuations &&
            this.recoveryManager.isTruncated();

          if (shouldContinue) {
            this.continuationCount++;
            this.onContinuationStart?.(this.continuationCount);

            try {
              const newStream = await this.onContinuationNeeded!(
                this.recoveryManager.getBufferedContent(),
                this.continuationCount,
              );
              this.currentReader = newStream.getReader();
              // Continue the pump loop with the new reader
              continue;
            } catch (continuationError) {
              // If the continuation call itself fails, close the stream
              console.error(
                '[SwitchableStream] Continuation request failed:',
                continuationError,
              );
              this.close();
              return;
            }
          } else {
            // No more continuations — check if we should warn
            if (
              this.recoveryManager.isTruncated() &&
              this.continuationCount >= this.maxContinuations
            ) {
              this.onContinuationsExhausted?.(this.continuationCount);
            }
            this.close();
            return;
          }
        }

        // Forward the chunk to the output stream
        if (value && !this.isClosed) {
          // Decode text for the recovery manager
          const text = this.decoder.decode(value, { stream: true });
          this.recoveryManager.onChunk(text);

          // Pass raw bytes through to the consumer
          this.outputController.enqueue(value);
        }
      }
    } catch (error) {
      if (!this.isClosed) {
        console.error('[SwitchableStream] Pump error:', error);
        try {
          this.outputController?.error(error);
        } catch {
          // Controller may already be errored/closed
        }
        this.isClosed = true;
      }
    }
  }

  private close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    try {
      this.outputController?.close();
    } catch {
      // Controller may already be closed
    }
  }
}
