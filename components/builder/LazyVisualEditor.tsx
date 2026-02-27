'use client';

import dynamic from 'next/dynamic';

const VisualEditor = dynamic(() => import('./VisualEditor'), {
  loading: () => null,
  ssr: false,
});

export default VisualEditor;
