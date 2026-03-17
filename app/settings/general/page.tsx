'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Loader2, Trash2 } from 'lucide-react';
import { getActiveTeamId, setActiveWorkspace } from '@/lib/workspace/active-workspace';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function SettingsGeneralPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [role, setRole] = useState('');

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchTeam = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`);
      if (!res.ok) throw new Error('Failed to fetch team');
      const { team } = await res.json();
      setName(team.name || '');
      setDescription(team.description || '');
      setSlug(team.slug || '');
      setRole(team.role || '');
    } catch {
      toast.error('Could not load workspace settings.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const id = getActiveTeamId();
    setTeamId(id);
    if (id) {
      fetchTeam(id);
    } else {
      setLoading(false);
    }
  }, [fetchTeam]);

  const handleSave = async () => {
    if (!teamId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save.');
        return;
      }
      // Update sidebar workspace name
      setActiveWorkspace({ id: teamId, name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!teamId || deleteInput !== name) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete workspace.');
        setDeleting(false);
        return;
      }
      toast.success('Workspace deleted.');
      setActiveWorkspace({ id: 'personal', name: 'Personal' });
      router.push('/workspace');
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

  // Personal workspace — no team settings
  if (!teamId) {
    return (
      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-zinc-900 mb-2">Workspace Settings</h2>
          <p className="text-sm text-zinc-500 mb-4">
            You&apos;re on your personal workspace. Create a team workspace to manage settings, invite members, and collaborate.
          </p>
          <a
            href="/workspace/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] transition-colors"
          >
            Create workspace
          </a>
        </div>
      </motion.div>
    );
  }

  const isOwner = role === 'owner';
  const isEditable = role === 'owner' || role === 'admin';

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
      {/* Workspace Info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-6">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Workspace name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!isEditable}
              maxLength={100}
              className={cn(
                'w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition-colors',
                isEditable
                  ? 'focus:border-[#FA4500] focus:outline-none'
                  : 'bg-zinc-50 text-zinc-400 cursor-not-allowed'
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!isEditable}
              maxLength={500}
              rows={3}
              placeholder="What is this workspace for?"
              className={cn(
                'w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm transition-colors resize-none',
                isEditable
                  ? 'focus:border-[#FA4500] focus:outline-none'
                  : 'bg-zinc-50 text-zinc-400 cursor-not-allowed'
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Slug</label>
            <input
              type="text"
              value={slug}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-zinc-400">Workspace slug cannot be changed.</p>
          </div>
          {isEditable && (
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone — owner only */}
      {isOwner && (
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
            <Trash2 size={14} />
            Danger Zone
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Permanently delete this workspace. All team members will be removed and any active subscription will be cancelled. Projects will be moved to your personal workspace.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete workspace
            </button>
          ) : (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-4">
              <p className="text-sm text-red-700 font-medium">
                Type <span className="font-bold">{name}</span> to confirm deletion:
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={name}
                className="w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteWorkspace}
                  disabled={deleteInput !== name || deleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete workspace'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
