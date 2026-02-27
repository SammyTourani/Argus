'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BuildError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  useEffect(() => {
    console.error('[Builder Error]', error);

    // Report to Sentry (dynamic import)
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, {
          tags: { page: 'builder', projectId: projectId ?? 'unknown' },
        });
      })
      .catch(() => {});
  }, [error, projectId]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center px-6">
      {/* Icon */}
      <div className="rounded-2xl bg-red-500/10 p-4 mb-6">
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>

      {/* Status code */}
      <div className="text-[#FA4500] text-xs font-mono mb-3 tracking-wider">
        BUILD ERROR
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-white mb-3">
        Something went wrong in the builder
      </h1>

      {/* Description */}
      <p className="text-white/50 text-sm max-w-md mb-2">
        The builder encountered an error. Your code and project are safe — try
        refreshing or return to your workspace.
      </p>

      {/* Error detail */}
      {error.message && (
        <p className="text-xs font-mono text-white/25 max-w-lg mb-8 break-all">
          {error.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{ background: '#FA4500' }}
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>

        <Link
          href={projectId ? `/workspace/${projectId}` : '/workspace'}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to workspace
        </Link>
      </div>

      {/* Error digest */}
      {error.digest && (
        <p className="mt-8 text-xs text-white/15 font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
