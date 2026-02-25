/**
 * Per-user Vite error tracking.
 *
 * Replaces the old `global.viteErrors` and `global.viteErrorsCache` patterns
 * which shared error state across ALL users.
 */

/** Module-scoped per-user Vite errors */
const viteErrors = new Map<string, any[]>();

/** Module-scoped per-user Vite errors cache */
const viteErrorsCache = new Map<string, { errors: any[]; timestamp: number } | null>();

// ─── viteErrors helpers ─────────────────────────────────────────────────────

export function getViteErrors(userId: string): any[] {
  let errors = viteErrors.get(userId);
  if (!errors) {
    errors = [];
    viteErrors.set(userId, errors);
  }
  return errors;
}

export function pushViteError(userId: string, error: any): void {
  const errors = getViteErrors(userId);
  errors.push(error);
  // Keep only last 50 errors per user
  if (errors.length > 50) {
    const trimmed = errors.slice(-50);
    viteErrors.set(userId, trimmed);
  }
}

// ─── viteErrorsCache helpers ────────────────────────────────────────────────

export function getViteErrorsCache(userId: string): { errors: any[]; timestamp: number } | null {
  return viteErrorsCache.get(userId) ?? null;
}

export function setViteErrorsCache(userId: string, cache: { errors: any[]; timestamp: number } | null): void {
  viteErrorsCache.set(userId, cache);
}

export function clearViteErrorsCache(userId: string): void {
  viteErrorsCache.set(userId, null);
}
