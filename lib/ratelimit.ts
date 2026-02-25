/**
 * Rate Limiting for Argus API routes
 *
 * Uses Upstash Redis (@upstash/ratelimit) when UPSTASH_REDIS_REST_URL is configured.
 * Falls back to in-memory rate limiting for local development.
 *
 * Upstash free tier: 10,000 requests/day — perfect for student projects.
 */

// ─── Upstash Redis (production) ──────────────────────────────────────────────

let upstashRatelimit: any = null;
let upstashRedis: any = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  // Dynamically import so the module still loads without Upstash
  try {
    const { Ratelimit } = require('@upstash/ratelimit');
    const { Redis } = require('@upstash/redis');

    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create pre-configured limiters for each endpoint type
    upstashRatelimit = {
      /** 10 AI generation requests per minute per user */
      aiGenerate: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'argus:ai_generate',
      }),
      /** 3 deploys per hour per user */
      deploy: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'argus:deploy',
      }),
      /** 20 project creates per hour per user */
      projectCreate: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(20, '1 h'),
        analytics: true,
        prefix: 'argus:project_create',
      }),
      /** Generic: 60 requests per minute (for other protected routes) */
      generic: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'argus:generic',
      }),
    };

    console.log('[ratelimit] Upstash Redis rate limiting enabled');
  } catch (e) {
    console.warn('[ratelimit] Failed to initialize Upstash, falling back to in-memory:', e);
  }
}

// ─── In-Memory fallback (dev / single-instance) ───────────────────────────────

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ─── Unified API ─────────────────────────────────────────────────────────────

export type RateLimitType = 'aiGenerate' | 'deploy' | 'projectCreate' | 'generic';

const IN_MEMORY_CONFIG: Record<RateLimitType, { limit: number; windowMs: number }> = {
  aiGenerate:    { limit: 10,  windowMs: 60 * 1000 },       // 10/min
  deploy:        { limit: 3,   windowMs: 60 * 60 * 1000 },  // 3/hr
  projectCreate: { limit: 20,  windowMs: 60 * 60 * 1000 },  // 20/hr
  generic:       { limit: 60,  windowMs: 60 * 1000 },       // 60/min
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** 'upstash' | 'memory' */
  backend: string;
}

/**
 * Check rate limit for a given key and type.
 * @param identifier - Unique key, e.g. userId or IP
 * @param type - Which limit configuration to use
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'generic'
): Promise<RateLimitResult> {
  // Use Upstash if available
  if (upstashRatelimit && upstashRatelimit[type]) {
    try {
      const result = await upstashRatelimit[type].limit(identifier);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        backend: 'upstash',
      };
    } catch (e) {
      console.warn('[ratelimit] Upstash error, falling back to in-memory:', e);
    }
  }

  // In-memory fallback
  const { limit, windowMs } = IN_MEMORY_CONFIG[type];
  const result = checkRateLimitInMemory(identifier, limit, windowMs);
  return { ...result, backend: 'memory' };
}

/**
 * Get the user's IP from a Next.js request (handles proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
