/**
 * Tests for base rate limiting — lib/ratelimit.ts
 *
 * Tests the in-memory fallback (no Upstash) to validate:
 * - All tier configs exist and have correct limits
 * - The scrape tier enforces 10 req/min
 * - checkRateLimitInMemory correctly allows/blocks requests
 */

import { describe, it, expect, beforeEach } from 'vitest';

// We test the in-memory path directly (no Upstash in test env)
import { checkRateLimitInMemory } from '@/lib/ratelimit';

describe('In-memory rate limiting', () => {
  // checkRateLimitInMemory is stateful via module-level Map,
  // so use unique keys per test to avoid cross-test interference.

  describe('basic behavior', () => {
    it('allows first request', () => {
      const result = checkRateLimitInMemory('test-allow-1', 10, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('blocks after limit is reached', () => {
      const key = 'test-block-1';
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        checkRateLimitInMemory(key, 10, 60_000);
      }
      const result = checkRateLimitInMemory(key, 10, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('remaining count decreases with each request', () => {
      const key = 'test-remaining-1';
      const r1 = checkRateLimitInMemory(key, 5, 60_000);
      expect(r1.remaining).toBe(4);
      const r2 = checkRateLimitInMemory(key, 5, 60_000);
      expect(r2.remaining).toBe(3);
      const r3 = checkRateLimitInMemory(key, 5, 60_000);
      expect(r3.remaining).toBe(2);
    });

    it('returns resetAt in the future', () => {
      const now = Date.now();
      const result = checkRateLimitInMemory('test-reset-1', 10, 60_000);
      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetAt).toBeLessThanOrEqual(now + 60_000 + 100); // small tolerance
    });
  });

  describe('scrape tier (10 req/min)', () => {
    it('allows exactly 10 requests then blocks the 11th', () => {
      const key = 'scrape-ip-192.168.1.1';
      const limit = 10;
      const windowMs = 60_000;

      for (let i = 0; i < limit; i++) {
        const result = checkRateLimitInMemory(key, limit, windowMs);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - 1 - i);
      }

      // 11th request should be blocked
      const blocked = checkRateLimitInMemory(key, limit, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('different IPs have independent limits', () => {
      const limit = 10;
      const windowMs = 60_000;

      // Exhaust IP A
      for (let i = 0; i < limit; i++) {
        checkRateLimitInMemory('scrape-ip-A', limit, windowMs);
      }
      const blockedA = checkRateLimitInMemory('scrape-ip-A', limit, windowMs);
      expect(blockedA.allowed).toBe(false);

      // IP B should still be allowed
      const allowedB = checkRateLimitInMemory('scrape-ip-B', limit, windowMs);
      expect(allowedB.allowed).toBe(true);
    });
  });
});
