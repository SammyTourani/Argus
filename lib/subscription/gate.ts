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
  creditsRemaining: number;
  creditsTotal: number;
}

/** Credit allocation per subscription tier */
export const TIER_CREDITS: Record<SubscriptionTier, number> = {
  free: 30,
  pro: 300,
  team: 500,
  enterprise: 500,
};

/** Tier-specific feature limits */
const TIER_CONFIG: Record<SubscriptionTier, {
  maxBuildsPerMonth: number | null;
  canDeploy: boolean;
  canUseAllModels: boolean;
  canCollaborate: boolean;
}> = {
  free: {
    maxBuildsPerMonth: null, // Now credit-gated, not build-count-gated
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
 * Auto-resets credits and builds_this_month when the billing period expires.
 */
export async function getUserSubscriptionGate(userId: string): Promise<SubscriptionGate> {
  const supabase = getSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, builds_this_month, builds_reset_at, credits_remaining, credits_total, credits_reset_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    // Default to free with no credits (safe fallback)
    return {
      tier: 'free',
      canBuild: false,
      canDeploy: false,
      canUseAllModels: false,
      canCollaborate: false,
      buildsRemaining: 0,
      maxBuildsPerMonth: null,
      creditsRemaining: 0,
      creditsTotal: 30,
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
  let creditsRemaining: number = profile.credits_remaining ?? TIER_CREDITS[tier];
  let creditsTotal: number = profile.credits_total ?? TIER_CREDITS[tier];

  // Auto-reset builds and credits if the reset date has passed
  const now = new Date();
  const creditsResetAt = profile.credits_reset_at ?? buildsResetAt;

  if (creditsResetAt && new Date(creditsResetAt) <= now) {
    // Calculate next reset: first of the next month
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    buildsThisMonth = 0;
    buildsResetAt = nextReset;
    creditsTotal = TIER_CREDITS[tier];
    creditsRemaining = creditsTotal;

    // Persist the reset (fire-and-forget — don't block the gate check)
    supabase
      .from('profiles')
      .update({
        builds_this_month: 0,
        builds_reset_at: nextReset,
        credits_remaining: creditsRemaining,
        credits_total: creditsTotal,
        credits_reset_at: nextReset,
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
      .update({ builds_reset_at: nextReset, credits_reset_at: nextReset })
      .eq('id', userId)
      .then(() => { /* best effort */ });
  }

  // Calculate builds remaining
  const buildsRemaining = config.maxBuildsPerMonth === null
    ? null
    : Math.max(0, config.maxBuildsPerMonth - buildsThisMonth);

  // canBuild is true as long as user has some credits OR can use free-after-depletion models
  const canBuild = config.maxBuildsPerMonth === null || buildsThisMonth < config.maxBuildsPerMonth;

  return {
    tier,
    canBuild,
    canDeploy: config.canDeploy,
    canUseAllModels: config.canUseAllModels,
    canCollaborate: config.canCollaborate,
    buildsRemaining,
    maxBuildsPerMonth: config.maxBuildsPerMonth,
    creditsRemaining,
    creditsTotal,
  };
}

/**
 * Atomically deduct credits from a user's balance.
 * Uses the deduct_credits Postgres RPC which handles:
 * - Row-level locking (FOR UPDATE) to prevent race conditions
 * - Auto-reset of credits when the billing period expires
 * - Build count increment
 *
 * Returns { success, remaining } — success is false if insufficient credits.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; remaining: number }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error('[deductCredits] RPC error:', error);
    return { success: false, remaining: 0 };
  }

  // RPC returns an array with one row: { success: boolean, remaining: number }
  const result = Array.isArray(data) ? data[0] : data;
  return {
    success: result?.success ?? false,
    remaining: result?.remaining ?? 0,
  };
}

/**
 * Increment the user's builds_this_month counter by 1 atomically.
 * Uses a Postgres RPC function to prevent race conditions from concurrent builds.
 * Call this AFTER a successful build/generation starts.
 *
 * NOTE: For credit-gated builds, use deductCredits() instead — it handles
 * both credit deduction and build count increment in one atomic operation.
 */
export async function incrementBuildCount(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc('increment_build_count', { p_user_id: userId });
  if (error) console.error('[incrementBuildCount] RPC error:', error);
}

// ─── Workspace-Scoped Subscription ─────────────────────────────────────────

/**
 * Returns a subscription gate for the active workspace.
 * - If teamId is null → personal workspace, delegates to getUserSubscriptionGate.
 * - If teamId is a UUID → reads from teams table (pooled credits per workspace).
 *
 * Verifies the user is a member of the team before returning team subscription.
 */
export async function getWorkspaceSubscriptionGate(
  userId: string,
  teamId: string | null
): Promise<SubscriptionGate> {
  // Personal workspace: use user-level gate (no behavior change)
  if (!teamId) {
    return getUserSubscriptionGate(userId);
  }

  const supabase = getSupabaseAdmin();

  // Verify user is a member of the team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    // Not a team member — fall back to free with no access
    return {
      tier: 'free',
      canBuild: false,
      canDeploy: false,
      canUseAllModels: false,
      canCollaborate: false,
      buildsRemaining: 0,
      maxBuildsPerMonth: null,
      creditsRemaining: 0,
      creditsTotal: 30,
    };
  }

  // Fetch team subscription data
  const { data: team, error } = await supabase
    .from('teams')
    .select('plan, subscription_status, credits_remaining, credits_total, credits_reset_at, builds_this_month, builds_reset_at')
    .eq('id', teamId)
    .single();

  if (error || !team) {
    return {
      tier: 'free',
      canBuild: false,
      canDeploy: false,
      canUseAllModels: false,
      canCollaborate: false,
      buildsRemaining: 0,
      maxBuildsPerMonth: null,
      creditsRemaining: 0,
      creditsTotal: 30,
    };
  }

  // Determine tier: plan is the tier, subscription_status controls whether it's active
  const tier: SubscriptionTier =
    team.subscription_status === 'active' &&
    (team.plan === 'pro' || team.plan === 'team' || team.plan === 'enterprise')
      ? (team.plan as SubscriptionTier)
      : 'free';

  const config = TIER_CONFIG[tier];

  let buildsThisMonth: number = team.builds_this_month ?? 0;
  let creditsRemaining: number = team.credits_remaining ?? TIER_CREDITS[tier];
  let creditsTotal: number = team.credits_total ?? TIER_CREDITS[tier];

  // Auto-reset credits if the billing period has expired
  const now = new Date();
  const creditsResetAt = team.credits_reset_at ?? team.builds_reset_at;

  if (creditsResetAt && new Date(creditsResetAt) <= now) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    buildsThisMonth = 0;
    creditsTotal = TIER_CREDITS[tier];
    creditsRemaining = creditsTotal;

    // Persist the reset (fire-and-forget)
    supabase
      .from('teams')
      .update({
        builds_this_month: 0,
        builds_reset_at: nextReset,
        credits_remaining: creditsRemaining,
        credits_total: creditsTotal,
        credits_reset_at: nextReset,
        updated_at: now.toISOString(),
      })
      .eq('id', teamId)
      .then(() => { /* best effort */ });
  }

  // Initialize reset date if missing
  if (!team.builds_reset_at) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    supabase
      .from('teams')
      .update({ builds_reset_at: nextReset, credits_reset_at: nextReset })
      .eq('id', teamId)
      .then(() => { /* best effort */ });
  }

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
    creditsRemaining,
    creditsTotal,
  };
}

/**
 * Deduct credits from the active workspace.
 * Routes to user-level or team-level deduction based on teamId.
 */
export async function deductWorkspaceCredits(
  userId: string,
  teamId: string | null,
  amount: number
): Promise<{ success: boolean; remaining: number }> {
  if (!teamId) {
    return deductCredits(userId, amount);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('deduct_team_credits', {
    p_team_id: teamId,
    p_amount: amount,
  });

  if (error) {
    console.error('[deductWorkspaceCredits] RPC error:', error);
    return { success: false, remaining: 0 };
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    success: result?.success ?? false,
    remaining: result?.remaining ?? 0,
  };
}
