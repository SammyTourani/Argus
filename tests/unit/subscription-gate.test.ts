/**
 * Tests for subscription gating — lib/subscription/gate.ts
 *
 * Validates feature access per tier: free users have limited builds and no
 * deploy; pro/team users get unlimited builds and full access.
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

  it('free user: canBuild=true when under limit, canDeploy=false', async () => {
    mockProfile({
      subscription_status: 'free',
      builds_this_month: 1,
      builds_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-1');

    expect(gate.tier).toBe('free');
    expect(gate.canBuild).toBe(true);
    expect(gate.canDeploy).toBe(false);
    expect(gate.maxBuildsPerMonth).toBe(3);
  });

  it('free user: canBuild=false when at limit', async () => {
    mockProfile({
      subscription_status: 'free',
      builds_this_month: 3,
      builds_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-2');

    expect(gate.canBuild).toBe(false);
    expect(gate.buildsRemaining).toBe(0);
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

  // ── Builds reset logic ─────────────────────────────────────────────────

  it('resets builds_this_month when builds_reset_at is in the past', async () => {
    mockProfile({
      subscription_status: 'free',
      builds_this_month: 3,
      builds_reset_at: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
    });

    const { getUserSubscriptionGate } = await import('@/lib/subscription/gate');
    const gate = await getUserSubscriptionGate('user-4');

    // After reset, builds_this_month should be treated as 0
    expect(gate.canBuild).toBe(true);
    expect(gate.buildsRemaining).toBe(3);
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
