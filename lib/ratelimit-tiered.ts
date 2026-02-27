/**
 * Tiered Rate Limiting for Argus
 *
 * Wraps the existing Upstash/in-memory rate limiter with tier-aware limits.
 * Each subscription tier (free, pro, team) gets different request quotas.
 *
 * The existing `checkRateLimit` function remains unchanged for backward compatibility.
 */

import { checkRateLimitInMemory } from './ratelimit';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RateLimitTier = 'free' | 'pro' | 'team';

export type TieredRateLimitType = 'aiGenerate' | 'deploy' | 'projectCreate';

interface TieredLimitConfig {
  requests: number;
  window: string; // e.g., '1m', '1h'
  windowMs: number; // window in milliseconds for in-memory fallback
}

interface TieredLimits {
  aiGenerate: TieredLimitConfig;
  deploy: TieredLimitConfig;
  projectCreate: TieredLimitConfig;
}

export interface TieredRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  tierLimit: number;
  backend: string;
}

// ─── Tier Configurations ──────────────────────────────────────────────────────

const TIER_LIMITS: Record<RateLimitTier, TieredLimits> = {
  free: {
    aiGenerate: { requests: 5, window: '1 m', windowMs: 60 * 1000 },
    deploy: { requests: 0, window: '1 h', windowMs: 60 * 60 * 1000 }, // free users can't deploy
    projectCreate: { requests: 5, window: '1 h', windowMs: 60 * 60 * 1000 },
  },
  pro: {
    aiGenerate: { requests: 15, window: '1 m', windowMs: 60 * 1000 },
    deploy: { requests: 10, window: '1 h', windowMs: 60 * 60 * 1000 },
    projectCreate: { requests: 50, window: '1 h', windowMs: 60 * 60 * 1000 },
  },
  team: {
    aiGenerate: { requests: 20, window: '1 m', windowMs: 60 * 1000 },
    deploy: { requests: 999, window: '1 h', windowMs: 60 * 60 * 1000 }, // effectively unlimited
    projectCreate: { requests: 100, window: '1 h', windowMs: 60 * 60 * 1000 },
  },
};

// ─── Dynamic Upstash Rate Limiter Cache ───────────────────────────────────────
// We create Upstash Ratelimit instances on-demand and cache them by tier+type.
// This avoids creating all permutations at module load time.

let upstashAvailable = false;
let UpstashRatelimit: any = null;
let upstashRedis: any = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    const { Ratelimit } = require('@upstash/ratelimit');
    const { Redis } = require('@upstash/redis');
    UpstashRatelimit = Ratelimit;
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashAvailable = true;
  } catch (e) {
    console.warn('[ratelimit-tiered] Upstash not available, using in-memory fallback');
  }
}

const upstashLimiterCache = new Map<string, any>();

function getUpstashLimiter(tier: RateLimitTier, type: TieredRateLimitType): any | null {
  if (!upstashAvailable || !UpstashRatelimit || !upstashRedis) return null;

  const cacheKey = `${tier}:${type}`;
  if (upstashLimiterCache.has(cacheKey)) return upstashLimiterCache.get(cacheKey);

  const config = TIER_LIMITS[tier][type];
  if (config.requests === 0) return null; // blocked action, no limiter needed

  const limiter = new UpstashRatelimit({
    redis: upstashRedis,
    limiter: UpstashRatelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `argus:tiered:${tier}:${type}`,
  });

  upstashLimiterCache.set(cacheKey, limiter);
  return limiter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check rate limit for a given user, respecting their subscription tier.
 *
 * @param userId - The authenticated user's ID
 * @param tier - The user's subscription tier (free, pro, team)
 * @param type - Which action to rate limit
 */
export async function checkTieredRateLimit(
  userId: string,
  tier: RateLimitTier,
  type: TieredRateLimitType
): Promise<TieredRateLimitResult> {
  const config = TIER_LIMITS[tier][type];

  // If tier has 0 requests for this type, block immediately
  if (config.requests === 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + config.windowMs,
      tierLimit: 0,
      backend: 'tier_blocked',
    };
  }

  // Try Upstash first
  const limiter = getUpstashLimiter(tier, type);
  if (limiter) {
    try {
      const result = await limiter.limit(userId);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        tierLimit: config.requests,
        backend: 'upstash',
      };
    } catch (e) {
      console.warn('[ratelimit-tiered] Upstash error, falling back to in-memory:', e);
    }
  }

  // In-memory fallback
  const memKey = `tiered:${tier}:${type}:${userId}`;
  const result = checkRateLimitInMemory(memKey, config.requests, config.windowMs);
  return {
    ...result,
    tierLimit: config.requests,
    backend: 'memory',
  };
}

/**
 * Get the tier limits configuration for display in the UI.
 */
export function getTierLimits(tier: RateLimitTier): TieredLimits {
  return TIER_LIMITS[tier];
}
