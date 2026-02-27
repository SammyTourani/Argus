'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  createLockedFilesManager,
  type LockedFilesManager,
} from '@/lib/editor/locked-files';

/**
 * React hook that bridges the framework-agnostic LockedFilesManager into
 * React component state.  Creates the manager once per projectId+buildId
 * combination and keeps React in sync via the manager's onChange listener.
 */
export function useLockedFiles(projectId: string, buildId: string) {
  const managerRef = useRef<LockedFilesManager | null>(null);

  // Stable manager instance — recreated only when projectId/buildId change
  const manager = useMemo(() => {
    const m = createLockedFilesManager({ projectId, buildId });
    managerRef.current = m;
    return m;
  }, [projectId, buildId]);

  const [lockedFiles, setLockedFiles] = useState<string[]>(() =>
    manager.getLockedFiles(),
  );

  // Keep React state in sync with the manager
  useEffect(() => {
    // Hydrate immediately in case manager changed
    setLockedFiles(manager.getLockedFiles());

    const unsubscribe = manager.onChange((files) => {
      setLockedFiles(files);
    });

    return unsubscribe;
  }, [manager]);

  const isLocked = useCallback(
    (filePath: string): boolean => {
      return manager.isLocked(filePath);
    },
    [manager],
  );

  const toggleLock = useCallback(
    (filePath: string): void => {
      manager.toggleLock(filePath);
    },
    [manager],
  );

  const lockFile = useCallback(
    (filePath: string): void => {
      manager.lockFile(filePath);
    },
    [manager],
  );

  const unlockFile = useCallback(
    (filePath: string): void => {
      manager.unlockFile(filePath);
    },
    [manager],
  );

  const getSystemPromptInjection = useCallback((): string => {
    return manager.getSystemPromptInjection();
  }, [manager]);

  return {
    lockedFiles,
    isLocked,
    toggleLock,
    lockFile,
    unlockFile,
    getSystemPromptInjection,
  };
}
