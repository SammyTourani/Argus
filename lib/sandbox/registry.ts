/**
 * Per-user sandbox registry — isolates sandbox state by authenticated user ID.
 *
 * Replaces the old `global.activeSandbox / global.sandboxData / global.existingFiles`
 * pattern which shared a single sandbox across ALL users on the same serverless
 * instance, creating a critical multi-tenant security hole.
 */

import type { SandboxState } from '@/types/sandbox';
import { SandboxProvider } from './types';

export interface UserSandboxEntry {
  /** The raw Vercel / legacy sandbox handle (v1 routes) */
  sandbox: any;
  /** The provider-pattern sandbox (v2 routes) */
  provider: SandboxProvider | null;
  /** Metadata such as sandboxId and preview URL */
  sandboxData: { sandboxId: string; url: string; [key: string]: any } | null;
  /** Set of files that have been written into the sandbox */
  existingFiles: Set<string>;
  /** Full sandbox state (file cache, etc.) */
  sandboxState: SandboxState | null;
  /** Whether sandbox creation is currently in progress for this user */
  creationInProgress: boolean;
  /** Promise for in-flight sandbox creation (so concurrent requests de-dup) */
  creationPromise: Promise<any> | null;
  /** Timestamp of last access — used for stale cleanup */
  lastAccessedAt: number;
}

function createEmptyEntry(): UserSandboxEntry {
  return {
    sandbox: null,
    provider: null,
    sandboxData: null,
    existingFiles: new Set<string>(),
    sandboxState: null,
    creationInProgress: false,
    creationPromise: null,
    lastAccessedAt: Date.now(),
  };
}

/** Module-scoped registry — survives across requests within the same serverless instance */
const registry = new Map<string, UserSandboxEntry>();

/** Default stale-entry timeout: 30 minutes */
const STALE_TIMEOUT_MS = 30 * 60 * 1000;

// ─── Public helpers ───────────────────────────────────────────────────────────

export function getSandbox(userId: string): UserSandboxEntry {
  let entry = registry.get(userId);
  if (!entry) {
    entry = createEmptyEntry();
    registry.set(userId, entry);
  }
  entry.lastAccessedAt = Date.now();
  return entry;
}

export function setSandbox(userId: string, partial: Partial<UserSandboxEntry>): UserSandboxEntry {
  const entry = getSandbox(userId);
  Object.assign(entry, partial);
  entry.lastAccessedAt = Date.now();
  return entry;
}

export function removeSandbox(userId: string): void {
  const entry = registry.get(userId);
  if (entry) {
    // Best-effort cleanup of the underlying sandbox
    try {
      if (entry.provider) {
        entry.provider.terminate().catch(() => {});
      } else if (entry.sandbox?.stop) {
        entry.sandbox.stop().catch(() => {});
      } else if (entry.sandbox?.kill) {
        entry.sandbox.kill().catch(() => {});
      }
    } catch {
      // swallow — we're tearing down
    }
    registry.delete(userId);
  }
}

/**
 * Remove all entries that have not been accessed in `maxAgeMs`.
 * Called automatically at the end of sandbox-creation routes, but can also
 * be invoked from a cron/health endpoint.
 */
export function cleanupStale(maxAgeMs: number = STALE_TIMEOUT_MS): number {
  const now = Date.now();
  let removed = 0;
  for (const [userId, entry] of registry.entries()) {
    if (now - entry.lastAccessedAt > maxAgeMs) {
      removeSandbox(userId);
      removed++;
    }
  }
  return removed;
}

export { registry };
