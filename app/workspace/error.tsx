'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Workspace Error]', error);

    // Report to Sentry (dynamic import)
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, {
          tags: { page: 'workspace' },
        });
      })
      .catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
      {/* Icon */}
      <div className="rounded-2xl bg-red-50 p-4 mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-zinc-900 mb-3">
        Workspace Error
      </h1>

      {/* Description */}
      <p className="text-zinc-500 text-sm max-w-md mb-2">
        Something went wrong loading your workspace. Your projects are safe — this
        is usually a temporary issue.
      </p>

      {/* Error detail */}
      {error.message && (
        <p className="text-xs font-mono text-zinc-400 max-w-lg mb-8 break-all">
          {error.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FA4500] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E63F00] active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Go home
        </Link>
      </div>

      {/* Error digest for support */}
      {error.digest && (
        <p className="mt-8 text-xs text-zinc-300">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
