'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redirect page: navigates to the latest build editor for this project.
 * Preserves bookmarked /workspace/{projectId} URLs by redirecting instead of 404.
 */
export default function ProjectRedirect() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Record view for "recently viewed" (fire-and-forget)
        fetch('/api/user/recents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId }),
        }).catch(() => {});

        // Fetch builds to find the latest one
        const res = await fetch(`/api/projects/${projectId}/builds`);
        if (cancelled) return;

        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/sign-in');
            return;
          }
          setError(true);
          return;
        }

        const { builds } = await res.json();
        if (cancelled) return;

        if (builds && builds.length > 0) {
          router.replace(`/workspace/${projectId}/build/${builds[0].id}`);
        } else {
          router.replace(`/workspace/${projectId}/build/new`);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [projectId, router]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-zinc-500">Could not load this project.</p>
        <a href="/workspace" className="text-sm text-blue-600 hover:underline">
          Back to workspace
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin h-6 w-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full" />
    </div>
  );
}
