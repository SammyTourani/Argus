'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import EditorPage from '@/components/editor/EditorPage';

function EditorLoadingSkeleton() {
  return (
    <div className="editor-root flex h-screen flex-col bg-[var(--editor-bg-deep)]">
      <div className="h-12 border-b border-[var(--editor-border-faint)] bg-[var(--editor-bg-base)]" />
      <div className="flex-1 flex">
        <div className="w-[250px] border-r border-[var(--editor-border-faint)] bg-[var(--editor-bg-base)]" />
        <div className="flex-1 border-r border-[var(--editor-border-faint)] bg-[var(--editor-bg-base)]" />
        <div className="flex-1 bg-[var(--editor-bg-deep)]" />
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) ?? 'new';
  const buildId = (params?.buildId as string) ?? 'latest';

  return (
    <Suspense fallback={<EditorLoadingSkeleton />}>
      <EditorPage projectId={projectId} buildId={buildId} />
    </Suspense>
  );
}
