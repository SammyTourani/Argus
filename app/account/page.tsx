'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, LogOut, Key, Bell, CreditCard, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { MODELS as SHARED_MODELS } from '@/lib/models';

type Section = 'profile' | 'model' | 'billing' | 'notifications';

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'model', label: 'Model Defaults', icon: Key },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const MODELS = SHARED_MODELS.map((m) => ({ id: m.id, name: m.name, provider: m.provider }));

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  // Profile fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Model preference
  const [defaultModel, setDefaultModel] = useState('claude-sonnet-4-6');

  // Notification prefs — persisted to localStorage
  // TODO: Add notifications column to profiles or user_preferences table for DB persistence
  const [notifyBuilds, setNotifyBuilds] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  // Load notification prefs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('argus_notification_prefs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.notifyBuilds === 'boolean') setNotifyBuilds(parsed.notifyBuilds);
        if (typeof parsed.notifyInvites === 'boolean') setNotifyInvites(parsed.notifyInvites);
        if (typeof parsed.notifyMarketing === 'boolean') setNotifyMarketing(parsed.notifyMarketing);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }

      setEmail(user.email ?? '');
      setFullName(user.user_metadata?.full_name ?? '');
      setAvatarUrl(user.user_metadata?.avatar_url ?? '');

      // Load model preference
      const prefRes = await fetch('/api/user/preferences');
      if (prefRes.ok) {
        const { preferences } = await prefRes.json();
        setDefaultModel(preferences?.default_model_id ?? 'claude-sonnet-4-6');
      }

      setLoading(false);
    };
    load();
  }, [router]);

  // Show billing success/cancel toast based on URL param
  useEffect(() => {
    const billing = searchParams?.get('billing');
    if (billing === 'success') {
      toast.success('🎉 You\'re now on Pro!');
      setActiveSection('billing');
      // Clean up URL without triggering a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.toString());
    } else if (billing === 'cancelled') {
      toast.info('Upgrade cancelled. You can try again any time.');
      const url = new URL(window.location.href);
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleUpgrade = async (planName: 'pro' | 'team') => {
    setUpgradingPlan(planName);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || 'Failed to start checkout. Please try again.');
        return;
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        toast.error('No checkout URL returned. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveModel = async () => {
    setSaving(true);
    await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_model_id: defaultModel }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Top nav */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-zinc-200 bg-white px-6">
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Workspace
        </Link>
        <span className="mx-3 text-zinc-300">/</span>
        <span className="text-sm font-medium text-zinc-900">Account Settings</span>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-48 shrink-0">
          <nav className="space-y-1 sticky top-20">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeSection === s.id
                      ? 'bg-orange-50 text-[#FA4500]'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <Icon size={15} className={activeSection === s.id ? 'text-[#FA4500]' : 'text-zinc-400'} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeSection === 'profile' && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-6">Profile</h2>
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center text-xl font-bold text-zinc-500">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        fullName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{fullName || 'No name set'}</p>
                      <p className="text-xs text-zinc-400">{email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-[#FA4500] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-zinc-400">Email cannot be changed here.</p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors"
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save profile'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'model' && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-2">Default AI Model</h2>
                <p className="text-sm text-zinc-500 mb-6">Used for new projects unless overridden per-project.</p>
                <div className="space-y-2 mb-6">
                  {MODELS.map(m => (
                    <label
                      key={m.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                        defaultModel === m.id ? 'border-[#FA4500] bg-orange-50' : 'border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={m.id}
                        checked={defaultModel === m.id}
                        onChange={() => setDefaultModel(m.id)}
                        className="accent-[#FA4500]"
                      />
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{m.name}</div>
                        <div className="text-xs text-zinc-400">{m.provider}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSaveModel}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors"
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save preference'}
                </button>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-2">Billing</h2>
                <p className="text-sm text-zinc-500 mb-6">Manage your subscription and payment methods.</p>
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-5 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Free Plan</p>
                      <p className="text-xs text-zinc-400 mt-0.5">3 projects · 10 builds/month</p>
                    </div>
                    <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">Current</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Pro', planKey: 'pro' as const, price: '$19/mo', features: '20 projects · 100 builds · Custom domain', badge: 'Most popular' },
                    { name: 'Team', planKey: 'team' as const, price: '$49/mo', features: 'Unlimited · Team collaboration · Priority support', badge: null },
                  ].map(plan => (
                    <div key={plan.name} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{plan.name}</span>
                          {plan.badge && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-[#FA4500]">{plan.badge}</span>}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{plan.features}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">{plan.price}</p>
                        <button
                          onClick={() => handleUpgrade(plan.planKey)}
                          disabled={upgradingPlan === plan.planKey}
                          className="mt-1 text-xs font-semibold text-[#FA4500] hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {upgradingPlan === plan.planKey ? 'Redirecting...' : 'Upgrade →'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-6">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Build updates', desc: 'Get notified when a build completes or fails', state: notifyBuilds, set: setNotifyBuilds },
                    { label: 'Collaboration invites', desc: 'Email me when someone invites me to a project', state: notifyInvites, set: setNotifyInvites },
                    { label: 'Product updates', desc: 'Occasional emails about new features', state: notifyMarketing, set: setNotifyMarketing },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.set(!item.state)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors duration-200',
                          item.state ? 'bg-[#FA4500]' : 'bg-zinc-200'
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          item.state ? 'translate-x-5' : 'translate-x-0.5'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('argus_notification_prefs', JSON.stringify({
                        notifyBuilds,
                        notifyInvites,
                        notifyMarketing,
                      }));
                    } catch {}
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                  className="mt-6 flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] transition-colors"
                >
                  <Save size={14} />
                  {saved ? '✓ Saved' : 'Save preferences'}
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FA4500] border-t-transparent" />
      </div>
    }>
      <AccountPageInner />
    </Suspense>
  );
}
