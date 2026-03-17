'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Loader2, LogOut, Trash2, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function SettingsAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [providers, setProviders] = useState<string[]>([]);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }
      setEmail(user.email ?? '');
      setFullName(user.user_metadata?.full_name ?? '');
      setAvatarUrl(user.user_metadata?.avatar_url ?? '');
      // Extract linked providers from identities
      const linkedProviders = (user.identities || []).map((i: { provider: string }) => i.provider);
      setProviders(linkedProviders);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail.trim().toLowerCase() !== email.toLowerCase()) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: deleteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete account.');
        setDeleting(false);
        return;
      }
      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      toast.error('Something went wrong.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
      {/* Profile */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-6">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center text-xl font-bold text-zinc-500">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : fullName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? 'U'}
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
            <input type="email" value={email} disabled className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed" />
            <p className="mt-1 text-xs text-zinc-400">Email is managed by your authentication provider.</p>
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors">
            <Save size={14} />{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Shield size={14} />
          Linked Accounts
        </h3>
        {providers.length === 0 ? (
          <p className="text-sm text-zinc-400">No linked accounts found.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {providers.map(provider => (
              <span key={provider} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 capitalize">
                {provider === 'google' && '🔵'}
                {provider === 'github' && '⚫'}
                {provider === 'email' && '✉️'}
                {!['google', 'github', 'email'].includes(provider) && '🔗'}
                {provider}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* Delete Account — Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
          <Trash2 size={14} />
          Delete Account
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          Permanently delete your Argus account. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-4">
            <div className="text-sm text-red-700 space-y-1">
              <p className="font-medium">This will permanently:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5 text-red-600">
                <li>Delete all your projects and builds</li>
                <li>Delete all workspaces you own</li>
                <li>Cancel all active subscriptions</li>
                <li>Remove all your API keys and data</li>
                <li>Remove you from all shared workspaces</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium mb-1.5">
                Type <span className="font-bold">{email}</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteEmail}
                onChange={e => setDeleteEmail(e.target.value)}
                placeholder={email}
                className="w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteEmail.trim().toLowerCase() !== email.toLowerCase() || deleting}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                  deleteEmail.trim().toLowerCase() === email.toLowerCase()
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-300 cursor-not-allowed'
                )}
              >
                {deleting ? 'Deleting...' : 'Delete my account'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(''); }}
                className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
