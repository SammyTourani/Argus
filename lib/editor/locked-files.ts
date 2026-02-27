/**
 * File Locking Manager
 *
 * Framework-agnostic manager that maintains a set of locked file paths per
 * project/build. Locked files are injected into the AI system prompt so
 * the model knows not to overwrite user-protected files.
 *
 * Persistence: localStorage by default, with a Supabase helper for
 * server-side persistence when needed.
 */

/* ─── Types ─── */

export type LockedFilesChangeCallback = (lockedFiles: string[]) => void;

export interface LockedFilesManager {
  /** Lock a single file path. */
  lockFile(filePath: string): void;
  /** Unlock a single file path. */
  unlockFile(filePath: string): void;
  /** Toggle the lock state of a file path. */
  toggleLock(filePath: string): void;
  /** Check whether a specific file path is locked. */
  isLocked(filePath: string): boolean;

  /** Return all currently-locked file paths (sorted). */
  getLockedFiles(): string[];

  /**
   * Generate the system-prompt injection that tells the AI which files
   * are locked and must not be modified.  Returns an empty string when
   * no files are locked.
   */
  getSystemPromptInjection(): string;

  /** Persist current lock state to storage. */
  save(): void;
  /** Load lock state from storage (replaces in-memory set). */
  load(): void;

  /**
   * Subscribe to lock-state changes.
   * @returns An unsubscribe function.
   */
  onChange(callback: LockedFilesChangeCallback): () => void;
}

export interface CreateLockedFilesManagerOptions {
  projectId: string;
  buildId: string;
  /** Override the localStorage key (useful for testing). */
  storageKey?: string;
}

/* ─── Helpers ─── */

function defaultStorageKey(projectId: string, buildId: string): string {
  return `argus_locked_files_${projectId}_${buildId}`;
}

/* ─── Factory ─── */

export function createLockedFilesManager(
  options: CreateLockedFilesManagerOptions,
): LockedFilesManager {
  const { projectId, buildId, storageKey } = options;
  const key = storageKey ?? defaultStorageKey(projectId, buildId);

  let locked = new Set<string>();
  const listeners = new Set<LockedFilesChangeCallback>();

  /* ── Internal helpers ── */

  function notify(): void {
    const snapshot = getSorted();
    for (const cb of listeners) {
      try {
        cb(snapshot);
      } catch {
        /* listener errors must not break the manager */
      }
    }
  }

  function getSorted(): string[] {
    return Array.from(locked).sort();
  }

  /* ── Public API ── */

  function lockFile(filePath: string): void {
    if (locked.has(filePath)) return;
    locked.add(filePath);
    save();
    notify();
  }

  function unlockFile(filePath: string): void {
    if (!locked.has(filePath)) return;
    locked.delete(filePath);
    save();
    notify();
  }

  function toggleLock(filePath: string): void {
    if (locked.has(filePath)) {
      unlockFile(filePath);
    } else {
      lockFile(filePath);
    }
  }

  function isLocked(filePath: string): boolean {
    return locked.has(filePath);
  }

  function getLockedFiles(): string[] {
    return getSorted();
  }

  function getSystemPromptInjection(): string {
    const files = getSorted();
    if (files.length === 0) return '';

    const fileList = files.map((f) => `- ${f}`).join('\n');

    return [
      'LOCKED FILES - DO NOT MODIFY:',
      'The following files have been locked by the user. You MUST NOT modify, overwrite, or delete these files under any circumstances. If the user asks you to modify a locked file, inform them that the file is locked and suggest they unlock it first.',
      '',
      'Locked files:',
      fileList,
    ].join('\n');
  }

  function save(): void {
    try {
      const data = JSON.stringify(getSorted());
      localStorage.setItem(key, data);
    } catch {
      /* SSR / private browsing — silently ignore */
    }
  }

  function load(): void {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        locked = new Set<string>();
      } else {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          locked = new Set<string>(parsed.filter((p): p is string => typeof p === 'string'));
        }
      }
    } catch {
      locked = new Set<string>();
    }
    notify();
  }

  function onChange(callback: LockedFilesChangeCallback): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }

  /* ── Hydrate from storage on creation ── */
  load();

  return {
    lockFile,
    unlockFile,
    toggleLock,
    isLocked,
    getLockedFiles,
    getSystemPromptInjection,
    save,
    load,
    onChange,
  };
}
