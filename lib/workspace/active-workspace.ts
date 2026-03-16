/**
 * Active workspace state management.
 *
 * Follows the same localStorage + CustomEvent + StorageEvent pattern
 * used for dark mode in app/workspace/layout.tsx.
 */

export interface ActiveWorkspace {
  id: string; // team UUID or 'personal'
  name: string;
}

const STORAGE_KEY = 'argus-active-workspace';
const EVENT_NAME = 'argus-workspace-change';
const DEFAULT_WORKSPACE: ActiveWorkspace = { id: 'personal', name: 'Personal' };

/** Read the active workspace from localStorage. Falls back to personal. */
export function getActiveWorkspace(): ActiveWorkspace {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return parsed as ActiveWorkspace;
    }
    return DEFAULT_WORKSPACE;
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

/** Set the active workspace. Persists to localStorage and fires events. */
export function setActiveWorkspace(ws: ActiveWorkspace): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
  } catch {}
  // Same-tab notification (CustomEvent)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: ws }));
}

/**
 * Listen for workspace changes (both same-tab and cross-tab).
 * Returns a cleanup function to remove listeners.
 */
export function onWorkspaceChange(
  callback: (ws: ActiveWorkspace) => void,
): () => void {
  // Same-tab changes via CustomEvent
  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent<ActiveWorkspace>).detail;
    if (detail) callback(detail);
  };

  // Cross-tab changes via StorageEvent
  const handleStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      const parsed = e.newValue ? JSON.parse(e.newValue) : DEFAULT_WORKSPACE;
      if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
        callback(parsed as ActiveWorkspace);
      } else {
        callback(DEFAULT_WORKSPACE);
      }
    } catch {
      callback(DEFAULT_WORKSPACE);
    }
  };

  window.addEventListener(EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

/** Convenience: returns null for personal workspace, UUID string for teams. */
export function getActiveTeamId(): string | null {
  const ws = getActiveWorkspace();
  return ws.id === 'personal' ? null : ws.id;
}
