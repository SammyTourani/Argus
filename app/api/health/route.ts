import { NextResponse } from 'next/server';
import { withCacheHeaders } from '@/lib/cache-headers';

/**
 * GET /api/health
 *
 * Lightweight health check (target: < 2s). Verifies that critical environment
 * variables are present and that Supabase is reachable. Does NOT call external
 * AI providers (use /api/health/deep for that).
 */

interface CheckResult {
  status: 'ok' | 'error';
  responseMs?: number;
  error?: string;
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { status: 'error', error: 'Missing SUPABASE env vars' };
    }
    // Lightweight REST call — doesn't depend on cookies/auth
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(3000),
    });
    return {
      status: res.ok ? 'ok' : 'error',
      responseMs: Date.now() - start,
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

async function checkStripe(): Promise<CheckResult> {
  const start = Date.now();
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { status: 'error', error: 'Missing STRIPE_SECRET_KEY' };
    }
    // Quick validation: hit the Stripe /v1/balance endpoint (lightweight)
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
      signal: AbortSignal.timeout(3000),
    });
    return {
      status: res.ok ? 'ok' : 'error',
      responseMs: Date.now() - start,
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

function checkEnvVar(name: string): CheckResult {
  return {
    status: process.env[name] ? 'ok' : 'error',
    ...(process.env[name] ? {} : { error: `Missing ${name}` }),
  };
}

export async function GET() {
  const start = Date.now();

  // Run checks in parallel for speed
  const [supabase, stripe] = await Promise.all([
    checkSupabase(),
    checkStripe(),
  ]);

  const checks: Record<string, CheckResult> = {
    supabase,
    stripe,
    ai_anthropic: checkEnvVar('ANTHROPIC_API_KEY'),
    ai_openai: checkEnvVar('OPENAI_API_KEY'),
    ai_google: checkEnvVar('GEMINI_API_KEY'),
    resend: checkEnvVar('RESEND_API_KEY'),
    upstash: checkEnvVar('UPSTASH_REDIS_REST_URL'),
    sentry: checkEnvVar('NEXT_PUBLIC_SENTRY_DSN'),
  };

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const hasErrors = Object.values(checks).some((c) => c.status === 'error');

  const response = NextResponse.json(
    {
      status: allOk ? 'ok' : hasErrors ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalResponseMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );

  return withCacheHeaders(response, 30);
}
