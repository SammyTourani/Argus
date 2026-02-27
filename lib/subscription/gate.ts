import { createClient as createServiceClient } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface SubscriptionGate {
  tier: SubscriptionTier;
  canBuild: boolean;
  canDeploy: boolean;
  canUseAllModels: boolean;
  canCollaborate: boolean;
  buildsRemaining: number | null; // null = unlimited
  maxBuildsPerMonth: number | null; // null = unlimited
}

/** Tier-specific feature limits */
const TIER_CONFIG: Record<SubscriptionTier, {
  maxBuildsPerMonth: number | null;
  canDeploy: boolean;
  canUseAllModels: boolean;
  canCollaborate: boolean;
}> = {
  free: {
    maxBuildsPerMonth: 3,
    canDeploy: false,
    canUseAllModels: false,
    canCollaborate: false,
  },
  pro: {
    maxBuildsPerMonth: null, // unlimited
    canDeploy: true,
    canUseAllModels: true,
    canCollaborate: false,
  },
  team: {
    maxBuildsPerMonth: null,
    canDeploy: true,
    canUseAllModels: true,
    canCollaborate: true,
  },
  enterprise: {
    maxBuildsPerMonth: null,
    canDeploy: true,
    canUseAllModels: true,
    canCollaborate: true,
  },
};

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Fetches the user's profile and returns a subscription gate object
 * describing what the user is allowed to do.
 *
 * Auto-resets builds_this_month when builds_reset_at has passed.
 */
export async function getUserSubscriptionGate(userId: string): Promise<SubscriptionGate> {
  const supabase = getSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, builds_this_month, builds_reset_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    // Default to free with no builds remaining (safe fallback)
    return {
      tier: 'free',
      canBuild: false,
      canDeploy: false,
      canUseAllModels: false,
      canCollaborate: false,
      buildsRemaining: 0,
      maxBuildsPerMonth: 3,
    };
  }

  // Normalise tier — treat 'cancelled' and 'past_due' as 'free'
  const rawStatus = profile.subscription_status as string;
  const tier: SubscriptionTier =
    rawStatus === 'pro' || rawStatus === 'team' || rawStatus === 'enterprise'
      ? rawStatus
      : 'free';

  const config = TIER_CONFIG[tier];

  let buildsThisMonth: number = profile.builds_this_month ?? 0;
  let buildsResetAt: string | null = profile.builds_reset_at ?? null;

  // Auto-reset builds if the reset date has passed
  const now = new Date();
  if (buildsResetAt && new Date(buildsResetAt) <= now) {
    // Calculate next reset: first of the next month
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    buildsThisMonth = 0;
    buildsResetAt = nextReset;

    // Persist the reset (fire-and-forget — don't block the gate check)
    supabase
      .from('profiles')
      .update({
        builds_this_month: 0,
        builds_reset_at: nextReset,
        updated_at: now.toISOString(),
      })
      .eq('id', userId)
      .then(() => { /* best effort */ });
  }

  // If user has never had a reset date, initialise it
  if (!buildsResetAt) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    supabase
      .from('profiles')
      .update({ builds_reset_at: nextReset })
      .eq('id', userId)
      .then(() => { /* best effort */ });
  }

  // Calculate builds remaining
  const buildsRemaining = config.maxBuildsPerMonth === null
    ? null
    : Math.max(0, config.maxBuildsPerMonth - buildsThisMonth);

  const canBuild = config.maxBuildsPerMonth === null || buildsThisMonth < config.maxBuildsPerMonth;

  return {
    tier,
    canBuild,
    canDeploy: config.canDeploy,
    canUseAllModels: config.canUseAllModels,
    canCollaborate: config.canCollaborate,
    buildsRemaining,
    maxBuildsPerMonth: config.maxBuildsPerMonth,
  };
}

/**
 * Increment the user's builds_this_month counter by 1.
 * Call this AFTER a successful build/generation starts.
 */
export async function incrementBuildCount(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Use raw SQL increment via RPC if available, else read-modify-write
  const { data: profile } = await supabase
    .from('profiles')
    .select('builds_this_month, builds_reset_at')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const now = new Date();
  const buildsResetAt = profile.builds_reset_at ? new Date(profile.builds_reset_at) : null;

  // If reset date passed, reset to 1 (this build) and set new reset
  if (buildsResetAt && buildsResetAt <= now) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    await supabase
      .from('profiles')
      .update({
        builds_this_month: 1,
        builds_reset_at: nextReset,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);
  } else {
    await supabase
      .from('profiles')
      .update({
        builds_this_month: (profile.builds_this_month ?? 0) + 1,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);
  }
}
