'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center px-6">
      <div className="text-[#FA4500] text-sm font-mono mb-4">500</div>
      <h1 className="text-4xl font-bold text-white mb-4">Something went wrong</h1>
      <p className="text-white/50 mb-8">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="text-[14px] font-medium text-white px-6 py-3 rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        style={{ background: '#FA4500' }}
      >
        Try again
      </button>
    </div>
  );
}
