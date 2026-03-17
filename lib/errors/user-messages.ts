/**
 * User-Friendly Error Messages
 *
 * Maps raw API / network / stream errors into structured, human-readable
 * messages that can be displayed in toasts, error boundaries, and inline
 * notifications.
 */

export interface UserError {
  /** Short headline (e.g. "Model is busy") */
  title: string;
  /** Longer explanation shown under the title */
  message: string;
  /** Optional call-to-action button text */
  action?: string;
  /** Optional link the CTA button should navigate to */
  actionUrl?: string;
  /** Whether the user should be offered a "Retry" option */
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface StatusError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

function getStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const e = error as StatusError;
    return e.status ?? e.statusCode;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    return (error as StatusError).code;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

function isNetworkError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('dns') ||
    msg.includes('socket hang up') ||
    getErrorCode(error) === 'ERR_NETWORK'
  );
}

function isTimeoutError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    getErrorCode(error) === 'ETIMEDOUT' ||
    getErrorCode(error) === 'ECONNABORTED'
  );
}

function isBuildLimitError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes('build limit') ||
    msg.includes('build_limit') ||
    msg.includes('quota exceeded') ||
    msg.includes('usage limit')
  );
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------

/**
 * Convert any error into a structured UserError suitable for display.
 *
 * @param error   - The raw error (Error instance, string, or unknown)
 * @param context - Optional context string for better messages (e.g. "generating code")
 */
export function toUserError(error: unknown, context?: string): UserError {
  const status = getStatus(error);
  const msg = getErrorMessage(error);
  const ctx = context ? ` while ${context}` : '';

  // ---- HTTP status-based mappings ----

  if (status === 429) {
    return {
      title: 'Model is busy',
      message: "We're processing a lot of requests. Trying another model...",
      retryable: true,
    };
  }

  if (status === 401) {
    return {
      title: 'Authentication required',
      message: 'Your session may have expired. Please sign in again.',
      action: 'Sign in',
      actionUrl: '/auth/login',
      retryable: false,
    };
  }

  if (status === 403) {
    if (isBuildLimitError(error)) {
      return {
        title: 'Build limit reached',
        message:
          "You've used all your builds for this period. Upgrade to Pro for unlimited builds.",
        action: 'Upgrade',
        actionUrl: '/settings',
        retryable: false,
      };
    }
    return {
      title: 'Access denied',
      message: "You don't have permission to perform this action.",
      retryable: false,
    };
  }

  if (status === 502 || status === 503) {
    return {
      title: 'AI service temporarily unavailable',
      message: `The AI provider is experiencing issues${ctx}. Please try again in a moment.`,
      retryable: true,
    };
  }

  if (status === 504) {
    return {
      title: 'Response took too long',
      message: `The AI provider didn't respond in time${ctx}. Please try again.`,
      retryable: true,
    };
  }

  if (status !== undefined && status >= 500) {
    return {
      title: 'Generation failed',
      message: 'Something went wrong on our end. Please try again.',
      retryable: true,
    };
  }

  // ---- Error-type-based mappings ----

  if (isNetworkError(error)) {
    return {
      title: 'Connection lost',
      message: 'Check your internet connection and try again.',
      retryable: true,
    };
  }

  if (isTimeoutError(error)) {
    return {
      title: 'Response took too long',
      message: `The request timed out${ctx}. This can happen with complex prompts. Please try again.`,
      retryable: true,
    };
  }

  if (isBuildLimitError(error)) {
    return {
      title: 'Build limit reached',
      message:
        "You've used all your builds for this period. Upgrade to Pro for unlimited builds.",
      action: 'Upgrade',
      actionUrl: '/settings',
      retryable: false,
    };
  }

  // ---- Stream-specific errors ----

  if (msg.toLowerCase().includes('stream')) {
    return {
      title: 'Stream interrupted',
      message: `The response was interrupted${ctx}. Please try again.`,
      retryable: true,
    };
  }

  // ---- Catch-all ----

  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
}
