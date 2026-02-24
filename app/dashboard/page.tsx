'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  builds_this_month: number;
  builds_reset_at: string;
  stripe_customer_id: string | null;
}

interface Build {
  id: string;
  input_url: string | null;
  input_prompt: string | null;
  style: string | null;
  model: string | null;
  status: string;
  preview_url: string | null;
  created_at: string;
  title: string | null;
  share_token: string | null;
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    complete: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Complete' },
    completed: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Complete' },
    building: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', label: 'Building' },
    running: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', label: 'Running' },
    pending: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'Pending' },
    failed: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Failed' },
    error: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Error' },
  };
  const s = colors[status?.toLowerCase()] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: status };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/sign-in');
        return;
      }

      const [profileRes, buildsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('builds').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setProfile(profileRes.data);
      setBuilds(buildsRes.data || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const copyShareLink = (build: Build) => {
    if (!build.share_token) return;
    const url = `https://buildargus.com/builds/${build.share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(build.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openBillingPortal = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/billing-portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FA4500', fontSize: '14px', fontFamily: 'system-ui' }}>Loading...</div>
      </div>
    );
  }

  const isPro = profile?.subscription_status === 'pro';
  const buildsUsed = profile?.builds_this_month || 0;
  const buildsLimit = isPro ? Infinity : 3;
  const pct = isPro ? 100 : Math.min((buildsUsed / 3) * 100, 100);
  const resetDate = profile?.builds_reset_at
    ? new Date(profile.builds_reset_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Soon';

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#FA4500', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>Argus</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{profile?.email}</span>
          <Link href="/app" style={{
            background: '#FA4500',
            color: 'white',
            textDecoration: 'none',
            padding: '7px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}>New Build →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            {profile?.full_name ? `Hey, ${profile.full_name.split(' ')[0]} 👋` : 'Your Dashboard'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Manage your builds and subscription</p>
        </div>

        {/* Upgrade banner */}
        {!isPro && buildsUsed >= 2 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(250,69,0,0.12), rgba(250,69,0,0.05))',
            border: '1px solid rgba(250,69,0,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap' as const,
          }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '2px' }}>You&apos;ve used {buildsUsed}/3 free builds this month</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Upgrade to Pro for unlimited builds, all models, and priority sandbox.</p>
            </div>
            <Link href="/api/stripe/create-checkout-session" style={{
              background: '#FA4500',
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap' as const,
            }}>Upgrade to Pro — $29/mo</Link>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* Builds card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Builds this month</p>
            <p style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
              {buildsUsed}{isPro ? '' : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>/3</span>}
            </p>
            {!isPro && (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                <div style={{ background: pct >= 100 ? '#ef4444' : '#FA4500', width: `${pct}%`, height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
              </div>
            )}
            {isPro && <p style={{ color: '#FA4500', fontSize: '12px', fontWeight: 600 }}>Unlimited</p>}
          </div>

          {/* Plan card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Plan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{isPro ? 'Pro' : 'Free'}</span>
              {isPro && <span style={{ background: 'rgba(250,69,0,0.15)', color: '#FA4500', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>ACTIVE</span>}
            </div>
            {isPro ? (
              <button onClick={openBillingPortal} disabled={billingLoading} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                {billingLoading ? 'Loading...' : 'Manage billing →'}
              </button>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Resets {resetDate}</p>
            )}
          </div>

          {/* Total builds */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Total builds</p>
            <p style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{builds.length}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>All time</p>
          </div>
        </div>

        {/* Build history */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Build History</h2>
            <Link href="/app" style={{ color: '#FA4500', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>+ New Build</Link>
          </div>

          {builds.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '60px 24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔮</p>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>No builds yet</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>Paste any URL and watch AI clone it in under 60 seconds.</p>
              <Link href="/app" style={{
                background: '#FA4500',
                color: 'white',
                textDecoration: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
              }}>Start your first build →</Link>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 44px', gap: '12px', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Source', 'Style', 'Status', 'When', ''].map((h, i) => (
                  <span key={i} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>
              {/* Build rows */}
              {builds.map((build, idx) => {
                const source = build.input_url || build.input_prompt || 'Unknown';
                const truncated = source.length > 50 ? source.slice(0, 47) + '…' : source;
                const isComplete = ['complete', 'completed'].includes(build.status?.toLowerCase());
                return (
                  <div
                    key={build.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 80px 80px 44px',
                      gap: '12px',
                      padding: '14px 20px',
                      alignItems: 'center',
                      borderBottom: idx < builds.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      cursor: isComplete && build.preview_url ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (isComplete && build.preview_url) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    onClick={() => { if (isComplete && build.preview_url) window.open(build.preview_url, '_blank'); }}
                  >
                    <div>
                      {build.title && <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{build.title}</p>}
                      <p style={{ color: build.title ? 'rgba(255,255,255,0.4)' : 'white', fontSize: build.title ? '12px' : '14px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncated}</p>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{build.style || '—'}</span>
                    <StatusBadge status={build.status} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{timeAgo(build.created_at)}</span>
                    <div onClick={e => e.stopPropagation()}>
                      {build.share_token && isComplete && (
                        <button
                          onClick={() => copyShareLink(build)}
                          title="Copy share link"
                          style={{
                            background: copiedId === build.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                            border: 'none',
                            borderRadius: '6px',
                            color: copiedId === build.id ? '#22c55e' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            fontSize: '12px',
                            transition: 'all 0.15s',
                          }}
                        >
                          {copiedId === build.id ? '✓' : '🔗'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
