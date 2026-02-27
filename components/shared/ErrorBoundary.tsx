'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  /** Custom fallback UI — replaces the default error panel entirely */
  fallback?: React.ReactNode;
  /** Callback fired when an error is caught (useful for parent-level logging) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Message shown in the default fallback when no custom `fallback` is provided */
  fallbackMessage?: string;
  /** Visual variant: "dark" for builder, "light" for workspace */
  variant?: 'dark' | 'light';
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Enhanced React Error Boundary with Sentry integration.
 *
 * - Captures unhandled React rendering errors
 * - Reports to Sentry (dynamic import so client builds without Sentry still work)
 * - Shows a styled fallback UI with "Try again" and "Report an issue" actions
 * - Supports dark (builder) and light (workspace) visual variants
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);

    // Report to Sentry (dynamic import to avoid hard dependency in all bundles)
    import('@sentry/nextjs')
      .then((Sentry) => {
        const eventId = Sentry.captureException(error, {
          contexts: {
            react: { componentStack: errorInfo.componentStack ?? undefined },
          },
        });
        this.setState({ eventId });
      })
      .catch(() => {
        // Sentry not available — no-op
      });

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Allow a completely custom fallback
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDark = (this.props.variant ?? 'dark') === 'dark';

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[400px] p-8 text-center rounded-xl',
          isDark ? 'bg-[#0A0A0A]' : 'bg-white'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'rounded-2xl p-3 mb-5',
            isDark ? 'bg-red-500/10' : 'bg-red-50'
          )}
        >
          <ShieldAlert
            className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-500')}
          />
        </div>

        {/* Heading */}
        <h2
          className={cn(
            'text-lg font-semibold mb-2',
            isDark ? 'text-white' : 'text-zinc-900'
          )}
        >
          Something went wrong
        </h2>

        {/* Description */}
        <p
          className={cn(
            'text-sm mb-1 max-w-md',
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          )}
        >
          {this.props.fallbackMessage || 'An unexpected error occurred in this section.'}
        </p>

        {/* Error detail (dev-friendly) */}
        {this.state.error?.message && (
          <p
            className={cn(
              'text-xs font-mono mb-6 max-w-lg break-all',
              isDark ? 'text-zinc-600' : 'text-zinc-400'
            )}
          >
            {this.state.error.message}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={this.handleReset}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
              'bg-[#FA4500] text-white hover:bg-[#E63F00] active:scale-[0.98]'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>

          {this.state.eventId && (
            <a
              href={`mailto:support@argus.dev?subject=Bug Report (${this.state.eventId})&body=Error ID: ${this.state.eventId}%0A%0ADescription:%0A`}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
                isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              Report an issue
            </a>
          )}
        </div>
      </div>
    );
  }
}
