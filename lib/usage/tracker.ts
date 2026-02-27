/**
 * Usage Tracking Service for Argus
 *
 * Tracks monthly build counts and deploy counts per user.
 * Queries the profiles table (builds_this_month, builds_reset_at) and
 * project_builds for deploy counts.
 *
 * Tier limits:
 *   free  = 3 builds/month, 0 deploys
 *   pro   = unlimited builds, 10 deploys/hr (rate-limited, not monthly-capped)
 *   team  = unlimited everything
 */

import { createClient } from '@/lib/supabase/server';
import type { RateLimitTier } from '@/lib/ratelimit-tiered';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsageStats {
  buildsThisMonth: number;
  buildsLimit: number | null; // null = unlimited
  deploysThisMonth: number;
  deploysLimit: number | null; // null = unlimited
  modelsUsed: string[];
  lastBuildAt: string | null;
  resetDate: string; // ISO string — first of next month
  tier: RateLimitTier;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_BUILD_LIMITS: Record<RateLimitTier, number | null> = {
  free: 3,
  pro: null, // unlimited
  team: null, // unlimited
};

const TIER_DEPLOY_LIMITS: Record<RateLimitTier, number | null> = {
  free: 0,
  pro: null, // rate-limited per hour, not monthly-capped
  team: null, // unlimited
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function getFirstOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get comprehensive usage stats for a user.
 */
export async function getUserUsage(userId: string): Promise<UsageStats> {
  const supabase = await createClient();

  // 1. Get profile data (builds_this_month, builds_reset_at, subscription_status)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, builds_this_month, builds_reset_at')
    .eq('id', userId)
    .single();

  const tier: RateLimitTier = (profile?.subscription_status as RateLimitTier) || 'free';
  let buildsThisMonth = profile?.builds_this_month ?? 0;
  const buildsResetAt = profile?.builds_reset_at;

  // Auto-reset if the reset date has passed
  if (buildsResetAt && new Date(buildsResetAt) < new Date()) {
    buildsThisMonth = 0;
    // Fire-and-forget reset — will be persisted on next increment
    await resetMonthlyCountsIfNeeded(userId);
  }

  // 2. Get user's project IDs
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('created_by', userId);

  const projectIds = (projects ?? []).map((p) => p.id);

  let deploysThisMonth = 0;
  let lastBuildAt: string | null = null;
  const modelsUsed: string[] = [];

  if (projectIds.length > 0) {
    const startOfMonth = getFirstOfCurrentMonth().toISOString();

    // 3. Count deploys this month (builds with preview_url set)
    const { count: deployCount } = await supabase
      .from('project_builds')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .not('preview_url', 'is', null)
      .gte('created_at', startOfMonth);

    deploysThisMonth = deployCount ?? 0;

    // 4. Get last build timestamp
    const { data: lastBuild } = await supabase
      .from('project_builds')
      .select('created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    lastBuildAt = lastBuild?.created_at ?? null;

    // 5. Get distinct models used this month
    const { data: buildModels } = await supabase
      .from('project_builds')
      .select('model_id')
      .in('project_id', projectIds)
      .gte('created_at', startOfMonth)
      .not('model_id', 'is', null);

    const uniqueModels = new Set<string>();
    for (const b of buildModels ?? []) {
      if (b.model_id) uniqueModels.add(b.model_id);
    }
    modelsUsed.push(...Array.from(uniqueModels));
  }

  return {
    buildsThisMonth,
    buildsLimit: TIER_BUILD_LIMITS[tier],
    deploysThisMonth,
    deploysLimit: TIER_DEPLOY_LIMITS[tier],
    modelsUsed,
    lastBuildAt,
    resetDate: getFirstOfNextMonth().toISOString(),
    tier,
  };
}

/**
 * Increment the user's monthly build count. Returns the new count and
 * whether the limit has been reached.
 */
export async function incrementBuildCount(
  userId: string
): Promise<{ newCount: number; limitReached: boolean }> {
  const supabase = await createClient();

  // Ensure counts are reset if needed before incrementing
  await resetMonthlyCountsIfNeeded(userId);

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, builds_this_month')
    .eq('id', userId)
    .single();

  const tier: RateLimitTier = (profile?.subscription_status as RateLimitTier) || 'free';
  const currentCount = profile?.builds_this_month ?? 0;
  const newCount = currentCount + 1;
  const limit = TIER_BUILD_LIMITS[tier];

  // Check if limit would be exceeded (for free tier)
  if (limit !== null && currentCount >= limit) {
    return { newCount: currentCount, limitReached: true };
  }

  // Increment
  await supabase
    .from('profiles')
    .update({ builds_this_month: newCount })
    .eq('id', userId);

  const limitReached = limit !== null && newCount >= limit;
  return { newCount, limitReached };
}

/**
 * Reset monthly counters if the reset date has passed.
 * Sets builds_this_month to 0 and builds_reset_at to first of next month.
 */
export async function resetMonthlyCountsIfNeeded(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('builds_reset_at')
    .eq('id', userId)
    .single();

  const resetAt = profile?.builds_reset_at;
  const now = new Date();

  // Reset if: no reset date set, or reset date is in the past
  if (!resetAt || new Date(resetAt) < now) {
    const nextReset = getFirstOfNextMonth().toISOString();
    await supabase
      .from('profiles')
      .update({
        builds_this_month: 0,
        builds_reset_at: nextReset,
      })
      .eq('id', userId);
  }
}

/**
 * Get build limit for a given tier.
 */
export function getBuildLimit(tier: RateLimitTier): number | null {
  return TIER_BUILD_LIMITS[tier];
}
