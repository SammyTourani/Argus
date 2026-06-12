/**
 * Tests for subscription gating — lib/subscription/gate.ts
 *
 * Validates feature access per tier. Free tier is credit-gated (no per-month
 * build-count cap), and only paid tiers (pro/team/enterprise) unlock deploy and
 * all-models access. Also covers the auto-reset of credits/builds when the
 * billing period has elapsed and the safe fallback on a DB error.
 *
 * Uses a mock Supabase client to avoid real database calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before importing the gate
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';

// Helper to set up the mock Supabase return for a given profile
function mockProfile(profile: Record<string, unknown> | null, error?: unknown) {
  const selectMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: profile, error: error ?? null }),
    }),
  });
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: selectMock,
      update: updateMock,
    }),
  });
}

describe('Subscription Gate', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // ── Free tier ────────────────────────────────────────────────────────────

  // Free tier is credit-gated, not build-count-gated: maxBuildsPerMonth is null,
  // so canBuild stays true and the credit balance is surfaced separately.
  it('free user: credit-gated with no build-count cap and no deploy access', async () => {
    mockProfile({
      subscription_status: 'free',
      builds_this_month: 1,
      builds_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
      credits_remaining: 20,
      credits_total: 30,
      credits_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-1');

    expect(gate.tier).toBe('free');
    expect(gate.canBuild).toBe(true);
    expect(gate.canDeploy).toBe(false);
    expect(gate.canUseAllModels).toBe(false);
    // Build-count gating was removed in favour of credit gating.
    expect(gate.maxBuildsPerMonth).toBeNull();
    expect(gate.buildsRemaining).toBeNull();
    expect(gate.creditsRemaining).toBe(20);
    expect(gate.creditsTotal).toBe(30);
  });

  it('free user: credit balance is reported even when fully depleted', async () => {
    mockProfile({
      subscription_status: 'free',
      builds_this_month: 3,
      builds_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
      credits_remaining: 0,
      credits_total: 30,
      credits_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-2');

    expect(gate.tier).toBe('free');
    // No build-count cap, so build admission is gated on credits at the call site.
    expect(gate.canBuild).toBe(true);
    expect(gate.maxBuildsPerMonth).toBeNull();
    expect(gate.creditsRemaining).toBe(0);
    expect(gate.creditsTotal).toBe(30);
  });

  it('treats cancelled subscription_status as the free tier', async () => {
    mockProfile({
      subscription_status: 'cancelled',
      builds_this_month: 0,
      builds_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
      credits_remaining: 5,
      credits_total: 30,
      credits_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-cancelled');

    expect(gate.tier).toBe('free');
    expect(gate.canDeploy).toBe(false);
    expect(gate.canUseAllModels).toBe(false);
  });

  // ── Pro tier ─────────────────────────────────────────────────────────────

  it('pro user: canBuild=true, canDeploy=true, unlimited builds', async () => {
    mockProfile({
      subscription_status: 'pro',
      builds_this_month: 50,
      builds_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-3');

    expect(gate.tier).toBe('pro');
    expect(gate.canBuild).toBe(true);
    expect(gate.canDeploy).toBe(true);
    expect(gate.maxBuildsPerMonth).toBeNull();
    expect(gate.buildsRemaining).toBeNull();
  });

  // ── Billing-period auto-reset ───────────────────────────────────────────

  it('auto-resets credits to the tier allocation when the reset date has passed', async () => {
    mockProfile({
      subscription_status: 'free',
      builds_this_month: 3,
      builds_reset_at: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
      credits_remaining: 0, // depleted before reset
      credits_total: 30,
      credits_reset_at: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-4');

    // The expired period restores the free tier's full 30-credit allocation.
    expect(gate.creditsRemaining).toBe(30);
    expect(gate.creditsTotal).toBe(30);
    expect(gate.canBuild).toBe(true);
  });

  // ── Error fallback ─────────────────────────────────────────────────────

  it('returns safe fallback when profile query fails', async () => {
    mockProfile(null, new Error('DB connection failed'));

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-5');

    expect(gate.tier).toBe('free');
    expect(gate.canBuild).toBe(false);
    expect(gate.canDeploy).toBe(false);
  });
});
