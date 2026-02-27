/**
 * Tests for tiered rate limiting — lib/ratelimit-tiered.ts
 *
 * Validates that each subscription tier (free, pro, team) gets the correct
 * request quotas for AI generation, deploys, and project creation.
 */

import { describe, it, expect } from 'vitest';
import { getTierLimits, type RateLimitTier } from '@/lib/ratelimit-tiered';

describe('Tiered Rate Limiting', () => {
  // ── Free tier limits ───────────────────────────────────────────────────────

  describe('Free tier', () => {
    const limits = getTierLimits('free');

    it('allows 5 AI generation requests per minute', () => {
      expect(limits.aiGenerate.requests).toBe(5);
      expect(limits.aiGenerate.windowMs).toBe(60_000);
    });

    it('blocks deploys entirely (0 requests)', () => {
      expect(limits.deploy.requests).toBe(0);
    });

    it('allows 5 project creates per hour', () => {
      expect(limits.projectCreate.requests).toBe(5);
      expect(limits.projectCreate.windowMs).toBe(3_600_000);
    });
  });

  // ── Pro tier limits ────────────────────────────────────────────────────────

  describe('Pro tier', () => {
    const limits = getTierLimits('pro');

    it('allows 15 AI generation requests per minute', () => {
      expect(limits.aiGenerate.requests).toBe(15);
      expect(limits.aiGenerate.windowMs).toBe(60_000);
    });

    it('allows 10 deploys per hour', () => {
      expect(limits.deploy.requests).toBe(10);
      expect(limits.deploy.windowMs).toBe(3_600_000);
    });

    it('allows 50 project creates per hour', () => {
      expect(limits.projectCreate.requests).toBe(50);
    });
  });

  // ── Team tier limits ───────────────────────────────────────────────────────

  describe('Team tier', () => {
    const limits = getTierLimits('team');

    it('allows 20 AI generation requests per minute', () => {
      expect(limits.aiGenerate.requests).toBe(20);
    });

    it('allows effectively unlimited deploys (999/hr)', () => {
      expect(limits.deploy.requests).toBe(999);
    });

    it('allows 100 project creates per hour', () => {
      expect(limits.projectCreate.requests).toBe(100);
    });
  });

  // ── Cross-tier validation ──────────────────────────────────────────────────

  describe('Tier ordering', () => {
    it('pro AI limit is higher than free', () => {
      const free = getTierLimits('free');
      const pro = getTierLimits('pro');
      expect(pro.aiGenerate.requests).toBeGreaterThan(free.aiGenerate.requests);
    });

    it('team AI limit is higher than pro', () => {
      const pro = getTierLimits('pro');
      const team = getTierLimits('team');
      expect(team.aiGenerate.requests).toBeGreaterThan(pro.aiGenerate.requests);
    });

    it('all tiers are defined', () => {
      const tiers: RateLimitTier[] = ['free', 'pro', 'team'];
      for (const tier of tiers) {
        const limits = getTierLimits(tier);
        expect(limits).toBeDefined();
        expect(limits.aiGenerate).toBeDefined();
        expect(limits.deploy).toBeDefined();
        expect(limits.projectCreate).toBeDefined();
      }
    });
  });
});
