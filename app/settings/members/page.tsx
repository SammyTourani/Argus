'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Loader2, Trash2, Crown, Shield, User } from 'lucide-react';
import { getActiveTeamId } from '@/lib/workspace/active-workspace';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface MemberProfile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profiles: MemberProfile;
}

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-[#FA4500] bg-orange-50 border-orange-200' },
  admin: { label: 'Admin', icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  member: { label: 'Member', icon: User, color: 'text-zinc-600 bg-zinc-50 border-zinc-200' },
};

export default function SettingsMembersPage() {
  const { toast } = useToast();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [callerRole, setCallerRole] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);

  // Removing
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const fetchMembers = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}/members`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMembers(data.members || []);
      setCallerRole(data.callerRole || '');
    } catch {
      toast.error('Could not load team members.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const id = getActiveTeamId();
    setTeamId(id);
    if (id) {
      fetchMembers(id);
    } else {
      setLoading(false);
    }
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!teamId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to add member.');
        return;
      }
      setMembers(prev => [...prev, data.member]);
      setInviteEmail('');
      toast.success('Member added!');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!teamId) return;
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to remove member.');
        return;
      }
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Member removed.');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setRemovingId(null);
      setConfirmRemoveId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update role.');
        return;
      }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole as Member['role'] } : m));
      toast.success('Role updated.');
    } catch {
      toast.error('Something went wrong.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!teamId) {
    return (
      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <Users size={32} className="mx-auto text-zinc-300 mb-4" />
          <h2 className="text-lg font-bold text-zinc-900 mb-2">Team Members</h2>
          <p className="text-sm text-zinc-500 mb-4">Create a team workspace to invite and manage members.</p>
          <a href="/workspace/new" className="inline-flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] transition-colors">
            Create workspace
          </a>
        </div>
      </motion.div>
    );
  }

  const canManage = callerRole === 'owner' || callerRole === 'admin';

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
      {/* Member List */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">Members ({members.length})</h2>
        </div>

        <div className="divide-y divide-zinc-100">
          {members.map(member => {
            const config = ROLE_CONFIG[member.role];
            const RoleIcon = config.icon;
            const initial = (member.profiles?.full_name || member.profiles?.email || 'U')[0].toUpperCase();

            return (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-500 shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{member.profiles?.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-zinc-400 truncate">{member.profiles?.email || ''}</p>
                </div>

                {/* Role badge / selector */}
                {canManage && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#FA4500]"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {callerRole === 'owner' && <option value="owner">Owner</option>}
                  </select>
                ) : (
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', config.color)}>
                    <RoleIcon size={11} />
                    {config.label}
                  </span>
                )}

                {/* Remove button */}
                {canManage && member.role !== 'owner' && (
                  confirmRemoveId === member.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removingId === member.id}
                        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {removingId === member.id ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(member.id)}
                      className="p-1.5 rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Form */}
      {canManage && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Plus size={14} />
            Add a member
          </h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-[#FA4500] focus:outline-none transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as 'member' | 'admin')}
              className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#FA4500]"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors shrink-0"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">The user must already have an Argus account.</p>
        </div>
      )}
    </motion.div>
  );
}
