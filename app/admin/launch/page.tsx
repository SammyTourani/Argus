/**
 * Admin Launch Checklist — /admin/launch
 *
 * A simple utility page that shows Argus launch readiness.
 * Protected: only accessible to users whose email matches ADMIN_EMAIL.
 *
 * Dark theme, monospace font, checklist style.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface CheckItem {
  label: string;
  ok: boolean;
  detail?: string;
}

async function runChecks(): Promise<CheckItem[]> {
  const checks: CheckItem[] = [];

  // ── Environment variables ──────────────────────────────────────────────
  const requiredEnvVars: [string, string][] = [
    ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role Key'],
    ['STRIPE_SECRET_KEY', 'Stripe Secret Key'],
    ['STRIPE_WEBHOOK_SECRET', 'Stripe Webhook Secret'],
    ['RESEND_API_KEY', 'Resend API Key'],
    ['OPENAI_API_KEY', 'OpenAI API Key'],
    ['ANTHROPIC_API_KEY', 'Anthropic API Key'],
    ['GEMINI_API_KEY', 'Gemini API Key'],
    ['GROQ_API_KEY', 'Groq API Key'],
    ['UPSTASH_REDIS_REST_URL', 'Upstash Redis URL'],
    ['UPSTASH_REDIS_REST_TOKEN', 'Upstash Redis Token'],
    ['ADMIN_EMAIL', 'Admin Email'],
  ];

  for (const [key, label] of requiredEnvVars) {
    checks.push({
      label: `Env: ${label}`,
      ok: !!process.env[key],
      detail: process.env[key] ? 'Configured' : 'Missing',
    });
  }

  // ── Sentry DSN ─────────────────────────────────────────────────────────
  checks.push({
    label: 'Sentry DSN',
    ok: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    detail: process.env.SENTRY_DSN ? 'Configured' : 'Missing',
  });

  // ── Database connection ────────────────────────────────────────────────
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('count').limit(1);
    checks.push({
      label: 'Database connection',
      ok: !error,
      detail: error ? error.message : 'Connected',
    });
  } catch (e) {
    checks.push({
      label: 'Database connection',
      ok: false,
      detail: e instanceof Error ? e.message : 'Failed',
    });
  }

  // ── Stripe webhooks ────────────────────────────────────────────────────
  checks.push({
    label: 'Stripe webhook secret',
    ok: !!process.env.STRIPE_WEBHOOK_SECRET,
    detail: process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Missing',
  });

  // ── Domain ─────────────────────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  checks.push({
    label: 'Domain configured',
    ok: !!appUrl && !appUrl.includes('localhost'),
    detail: appUrl || 'Not set',
  });

  // ── Marketplace seeded ─────────────────────────────────────────────────
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('marketplace_listings')
      .select('*', { count: 'exact', head: true });
    checks.push({
      label: 'Marketplace seeded',
      ok: (count ?? 0) > 0,
      detail: error ? error.message : `${count ?? 0} templates`,
    });
  } catch {
    checks.push({
      label: 'Marketplace seeded',
      ok: false,
      detail: 'Could not check',
    });
  }

  // ── Health check ───────────────────────────────────────────────────────
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' });
    const json = await res.json();
    checks.push({
      label: 'Health check endpoint',
      ok: json.status === 'ok',
      detail: json.status || 'Unknown',
    });
  } catch {
    checks.push({
      label: 'Health check endpoint',
      ok: false,
      detail: 'Could not reach',
    });
  }

  return checks;
}

export default async function LaunchChecklistPage() {
  // ── Auth gate ──────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect('/');
  }

  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);
  const passed = checks.filter((c) => c.ok).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: '#fafafa',
          }}
        >
          Argus Launch Checklist
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#a1a1a1',
            marginBottom: '2rem',
          }}
        >
          {passed}/{checks.length} checks passing
          {allOk ? ' — Ready to launch' : ' — Action required'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {checks.map((check) => (
            <div
              key={check.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1rem',
                backgroundColor: '#141414',
                borderRadius: '6px',
                border: `1px solid ${check.ok ? '#1a3a1a' : '#3a1a1a'}`,
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: check.ok ? '#22c55e' : '#ef4444',
                  flexShrink: 0,
                }}
              >
                {check.ok ? '[x]' : '[ ]'}
              </span>
              <span style={{ flex: 1, fontSize: '0.875rem' }}>{check.label}</span>
              {check.detail && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: check.ok ? '#4ade80' : '#f87171',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {check.detail}
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: allOk ? '#052e16' : '#450a0a',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: allOk ? '#86efac' : '#fca5a5',
          }}
        >
          {allOk
            ? 'All systems go. Ready for production launch.'
            : `${checks.length - passed} check(s) need attention before launch.`}
        </div>

        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: '#525252',
            textAlign: 'center',
          }}
        >
          Argus v1.0.0 &middot; Generated {new Date().toISOString().slice(0, 10)}
        </p>
      </div>
    </div>
  );
}
