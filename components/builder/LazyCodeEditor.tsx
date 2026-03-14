'use client';

import dynamic from 'next/dynamic';

const CodePanel = dynamic(() => import('./CodePanel'), {
  loading: () => (
    <div className="flex-1 bg-[var(--editor-bg-surface)] animate-pulse rounded-lg" />
  ),
  ssr: false,
});

export default CodePanel;
