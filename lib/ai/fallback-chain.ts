/**
 * AI Model Fallback Chain
 *
 * Tries the primary model first, then falls back through an ordered list of
 * alternative models on transient errors (429, 500+). Auth errors (401/403)
 * are not retried because they indicate a configuration issue, not a transient
 * failure.
 */

export interface FallbackConfig {
  /** Primary model ID (e.g. "anthropic/claude-sonnet-4-6") */
  primary: string;
  /** Ordered list of fallback model IDs to try when the primary fails */
  fallbacks: string[];
  /** Maximum retries *per model* before moving to the next fallback */
  maxRetries: number;
  /** Delay in ms between retries (applied with exponential backoff) */
  retryDelayMs: number;
}

export const DEFAULT_FALLBACK_CHAIN: FallbackConfig = {
  primary: 'anthropic/claude-sonnet-4-6',
  fallbacks: ['openai/gpt-4o', 'google/gemini-2.5-flash'],
  maxRetries: 2,
  retryDelayMs: 1000,
};

/** Errors that carry an HTTP status code from upstream providers */
interface StatusError extends Error {
  status?: number;
  statusCode?: number;
}

function getStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const e = error as StatusError;
    return e.status ?? e.statusCode;
  }
  return undefined;
}

/** Returns true for errors that should NOT be retried (auth / permission) */
function isNonRetryable(error: unknown): boolean {
  const status = getStatusCode(error);
  if (status === 401 || status === 403) return true;
  return false;
}

/** Returns true for errors that indicate a transient issue worth retrying */
function isRetryable(error: unknown): boolean {
  const status = getStatusCode(error);
  if (!status) {
    // Network errors, timeouts, etc. are retryable
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('timeout') ||
        msg.includes('econnreset') ||
        msg.includes('econnrefused') ||
        msg.includes('fetch failed') ||
        msg.includes('network') ||
        msg.includes('socket hang up') ||
        msg.includes('aborted')
      );
    }
    return false;
  }
  // 429 = rate limited, 500+ = server errors
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to build a ReadableStream using the given model chain.
 *
 * @param config       - Fallback configuration (primary, fallbacks, retry settings)
 * @param buildStreamFn - A function that takes a model ID and returns a ReadableStream.
 *                        This is where you call your AI SDK's `streamText()` etc.
 * @param onFallback   - Optional callback fired when falling back from one model to another.
 *
 * @returns The stream and the model ID that successfully produced it.
 *
 * @throws The last error encountered if all models (and their retries) fail.
 */
export async function streamWithFallback(
  config: FallbackConfig,
  buildStreamFn: (modelId: string) => Promise<ReadableStream>,
  onFallback?: (fromModel: string, toModel: string, error: Error) => void
): Promise<{ stream: ReadableStream; usedModel: string }> {
  const allModels = [config.primary, ...config.fallbacks];
  let lastError: Error | undefined;

  for (let modelIdx = 0; modelIdx < allModels.length; modelIdx++) {
    const modelId = allModels[modelIdx];

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const stream = await buildStreamFn(modelId);
        return { stream, usedModel: modelId };
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        // Non-retryable errors (401/403) — skip retries for this model, try next
        if (isNonRetryable(error)) {
          break;
        }

        // If it's not a retryable error type, don't bother retrying this model
        if (!isRetryable(error)) {
          // But still try the next model in the fallback chain
          break;
        }

        // If we have retries left for this model, wait and retry
        if (attempt < config.maxRetries) {
          const delay = config.retryDelayMs * Math.pow(2, attempt); // exponential backoff
          await sleep(delay);
          continue;
        }

        // Out of retries for this model — fall through to the next one
      }
    }

    // Notify that we're falling back to the next model (if there is one)
    const nextModel = allModels[modelIdx + 1];
    if (nextModel && lastError && onFallback) {
      onFallback(modelId, nextModel, lastError);
    }
  }

  // All models exhausted
  throw lastError ?? new Error('All models in the fallback chain failed');
}
