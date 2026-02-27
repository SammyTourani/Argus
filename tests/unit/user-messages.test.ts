/**
 * Tests for user-friendly error messages — lib/errors/user-messages.ts
 *
 * Validates the mapping from raw API errors to structured UserError objects
 * with correct retryable flags, titles, and upgrade CTAs.
 */

import { describe, it, expect } from 'vitest';
import { toUserError, type UserError } from '@/lib/errors/user-messages';

function makeStatusError(status: number, message = 'error'): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

describe('User Error Messages', () => {
  // ── 429 Rate Limit ─────────────────────────────────────────────────────

  it('429 → retryable with friendly message', () => {
    const result = toUserError(makeStatusError(429));
    expect(result.retryable).toBe(true);
    expect(result.title).toContain('busy');
  });

  // ── 403 + BUILD_LIMIT → upgrade CTA ────────────────────────────────────

  it('403 + build limit → not retryable with upgrade action', () => {
    const result = toUserError(makeStatusError(403, 'Build limit exceeded'));
    expect(result.retryable).toBe(false);
    expect(result.action).toBe('Upgrade');
    expect(result.actionUrl).toBe('/account');
  });

  it('403 without build limit → generic access denied', () => {
    const result = toUserError(makeStatusError(403, 'Forbidden'));
    expect(result.retryable).toBe(false);
    expect(result.title).toContain('denied');
  });

  // ── 401 Auth ───────────────────────────────────────────────────────────

  it('401 → not retryable, sign-in CTA', () => {
    const result = toUserError(makeStatusError(401));
    expect(result.retryable).toBe(false);
    expect(result.action).toBe('Sign in');
    expect(result.actionUrl).toContain('/auth');
  });

  // ── 500+ Server Errors ─────────────────────────────────────────────────

  it('500 → retryable', () => {
    const result = toUserError(makeStatusError(500));
    expect(result.retryable).toBe(true);
  });

  it('502 → retryable service unavailable', () => {
    const result = toUserError(makeStatusError(502));
    expect(result.retryable).toBe(true);
    expect(result.title).toContain('unavailable');
  });

  it('503 → retryable service unavailable', () => {
    const result = toUserError(makeStatusError(503));
    expect(result.retryable).toBe(true);
  });

  // ── Network / timeout errors ───────────────────────────────────────────

  it('network error → retryable with connection message', () => {
    const result = toUserError(new Error('fetch failed'));
    expect(result.retryable).toBe(true);
    expect(result.title).toContain('Connection');
  });

  it('timeout error → retryable', () => {
    const result = toUserError(new Error('Request timed out'));
    expect(result.retryable).toBe(true);
    expect(result.title).toContain('too long');
  });

  // ── Unknown error → safe fallback ──────────────────────────────────────

  it('unknown error → retryable with generic message', () => {
    const result = toUserError(new Error('Something completely unexpected'));
    expect(result.retryable).toBe(true);
    expect(result.title).toBeDefined();
  });
});
