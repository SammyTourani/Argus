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
}

interface Build {
  id: string;
  input_url: string | null;
  input_prompt: string | null;
  style: string | null;
  model: string | null;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
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
        supabase.from('builds').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      setProfile(profileRes.data);
      setBuilds(buildsRes.data || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/billing-portal');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Billing portal error:', e);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="w-32 h-32 border-3 border-border-muted border-t-heat-100 rounded-full animate-spin" />
      </div>
    );
  }

  const isPro = profile?.subscription_status === 'pro';
  const buildsUsed = profile?.builds_this_month || 0;
  const buildsLimit = isPro ? 'Unlimited' : '3';

  return (
    <div className="min-h-screen bg-background-base">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background-base/80 backdrop-blur-md border-b border-border-faint">
        <div className="max-w-[800px] mx-auto px-24 h-56 flex items-center justify-between">
          <div className="flex items-center gap-24">
            <Link href="/" className="text-[20px] font-bold tracking-tight text-accent-black">
              Argus
            </Link>
            <Link href="/app" className="text-label-medium text-black-alpha-48 hover:text-accent-black transition-colors">
              Builder
            </Link>
          </div>
          <div className="flex items-center gap-12">
            <button
              onClick={handleSignOut}
              className="text-label-small text-black-alpha-48 hover:text-accent-black transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-24 py-40">
        <h1 className="text-[28px] font-bold tracking-tight text-accent-black mb-32">Dashboard</h1>

        {/* Profile & Plan Card */}
        <div className="bg-white rounded-16 border border-border-faint p-24 mb-16">
          <div className="flex items-start justify-between mb-20">
            <div>
              <div className="flex items-center gap-8 mb-4">
                <h2 className="text-[18px] font-semibold text-accent-black">
                  {profile?.full_name || 'User'}
                </h2>
                <span
                  className="px-8 py-2 rounded-full text-[11px] font-semibold text-white"
                  style={{ background: isPro ? '#FA4500' : '#9CA3AF' }}
                >
                  {isPro ? 'Pro' : 'Free'}
                </span>
              </div>
              <p className="text-body-medium text-black-alpha-48">{profile?.email}</p>
            </div>
            <div className="w-40 h-40 rounded-full flex items-center justify-center text-white text-label-medium font-medium" style={{ background: '#FA4500' }}>
              {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
            </div>
          </div>

          {/* Builds Usage */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-6">
              <span className="text-label-small font-medium text-black-alpha-72">Builds this month</span>
              <span className="text-label-small text-black-alpha-48">
                {buildsUsed} / {buildsLimit}
              </span>
            </div>
            {!isPro && (
              <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((buildsUsed / 3) * 100, 100)}%`,
                    background: buildsUsed >= 3 ? '#EF4444' : '#FA4500',
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-8">
            {isPro ? (
              <button
                onClick={handleManageBilling}
                className="px-16 py-10 rounded-10 text-label-medium font-medium border border-border-muted text-accent-black hover:bg-gray-50 transition-all"
              >
                Manage billing
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="px-16 py-10 rounded-10 text-label-medium font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: '#FA4500' }}
              >
                {upgrading ? 'Redirecting...' : 'Upgrade to Pro — $29/mo'}
              </button>
            )}
            <Link
              href="/app"
              className="px-16 py-10 rounded-10 text-label-medium font-medium border border-border-muted text-accent-black hover:bg-gray-50 transition-all"
            >
              Go to builder
            </Link>
          </div>
        </div>

        {/* Recent Builds */}
        <div className="bg-white rounded-16 border border-border-faint p-24">
          <h3 className="text-[16px] font-semibold text-accent-black mb-16">Recent builds</h3>
          {builds.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-body-medium text-black-alpha-32 mb-8">No builds yet</p>
              <Link
                href="/app"
                className="text-label-medium font-medium hover:underline"
                style={{ color: '#FA4500' }}
              >
                Create your first build
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="flex items-center justify-between p-12 rounded-8 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body-medium text-accent-black truncate">
                      {build.input_url || build.input_prompt || 'Untitled build'}
                    </p>
                    <p className="text-label-small text-black-alpha-32">
                      {new Date(build.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                      {build.style && ` · ${build.style}`}
                    </p>
                  </div>
                  <span
                    className={`px-8 py-2 rounded-full text-[11px] font-medium ${
                      build.status === 'complete' ? 'bg-green-50 text-green-700' :
                      build.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {build.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
