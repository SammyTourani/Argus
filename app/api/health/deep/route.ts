import { NextResponse } from 'next/server';

/**
 * GET /api/health/deep
 *
 * Deep health check — actually calls AI providers with a tiny prompt to verify
 * connectivity and measure latency. Slower than /api/health (may take 5-15s)
 * but gives real end-to-end verification.
 *
 * Should NOT be polled frequently — use for dashboards, incident investigation,
 * or on-demand checks only.
 */

interface DeepCheckResult {
  status: 'ok' | 'error';
  responseMs: number;
  error?: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Provider health checks
// ---------------------------------------------------------------------------

async function checkAnthropicAPI(): Promise<DeepCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { status: 'error', responseMs: 0, error: 'Missing ANTHROPIC_API_KEY' };
    }
    const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
    const res = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Respond with "ok"' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const elapsed = Date.now() - start;
    if (res.ok) {
      return { status: 'ok', responseMs: elapsed, detail: 'claude-sonnet-4-6 reachable' };
    }
    return { status: 'error', responseMs: elapsed, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

async function checkOpenAIAPI(): Promise<DeepCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { status: 'error', responseMs: 0, error: 'Missing OPENAI_API_KEY' };
    }
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com';
    const res = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Respond with "ok"' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const elapsed = Date.now() - start;
    if (res.ok) {
      return { status: 'ok', responseMs: elapsed, detail: 'gpt-4o reachable' };
    }
    return { status: 'error', responseMs: elapsed, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

async function checkGoogleAI(): Promise<DeepCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { status: 'error', responseMs: 0, error: 'Missing GEMINI_API_KEY' };
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with "ok"' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const elapsed = Date.now() - start;
    if (res.ok) {
      return { status: 'ok', responseMs: elapsed, detail: 'gemini-2.5-flash reachable' };
    }
    return { status: 'error', responseMs: elapsed, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

async function checkSupabaseDeep(): Promise<DeepCheckResult> {
  const start = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { status: 'error', responseMs: 0, error: 'Missing SUPABASE env vars' };
    }
    // Run an actual lightweight query
    const res = await fetch(`${url}/rest/v1/profiles?select=count&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
      },
      signal: AbortSignal.timeout(5000),
    });
    const elapsed = Date.now() - start;
    return {
      status: res.ok ? 'ok' : 'error',
      responseMs: elapsed,
      ...(res.ok ? { detail: 'DB query successful' } : { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

async function checkStripeDeep(): Promise<DeepCheckResult> {
  const start = Date.now();
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { status: 'error', responseMs: 0, error: 'Missing STRIPE_SECRET_KEY' };
    }
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    const elapsed = Date.now() - start;
    return {
      status: res.ok ? 'ok' : 'error',
      responseMs: elapsed,
      ...(res.ok ? { detail: 'Balance endpoint reachable' } : { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return {
      status: 'error',
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET() {
  const start = Date.now();

  // Run all checks in parallel
  const [anthropic, openai, google, supabase, stripe] = await Promise.all([
    checkAnthropicAPI(),
    checkOpenAIAPI(),
    checkGoogleAI(),
    checkSupabaseDeep(),
    checkStripeDeep(),
  ]);

  const checks: Record<string, DeepCheckResult> = {
    'ai/anthropic': anthropic,
    'ai/openai': openai,
    'ai/google': google,
    supabase,
    stripe,
  };

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const errorCount = Object.values(checks).filter((c) => c.status === 'error').length;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : errorCount === Object.keys(checks).length ? 'down' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalResponseMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
