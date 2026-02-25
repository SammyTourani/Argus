'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, UserPlus, Mail, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Collaborator {
  id: string;
  invite_email: string | null;
  role: string;
  status: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

const ROLES = [
  { value: 'editor', label: 'Editor', desc: 'Can build and edit' },
  { value: 'viewer', label: 'Viewer', desc: 'Can view only' },
];

export default function ShareDialog({ open, onOpenChange, projectId, projectName }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [roleOpen, setRoleOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [sending, setSending] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/projects/${projectId}/collaborators`)
      .then(r => r.json())
      .then(d => setCollaborators(d.collaborators ?? []));
  }, [open, projectId]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError('');

    const res = await fetch(`/api/projects/${projectId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Failed to send invite');
      setSending(false);
      return;
    }

    setSentEmail(email.trim());
    setEmail('');
    setSending(false);
    setCollaborators(prev => [...prev, data.invite]);
    setTimeout(() => setSentEmail(''), 4000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/workspace/${projectId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const selectedRole = ROLES.find(r => r.value === role) ?? ROLES[0];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          asChild
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <Dialog.Title className="text-[15px] font-bold text-zinc-900">Share project</Dialog.Title>
                <p className="text-[12px] text-zinc-500 mt-0.5 truncate max-w-[280px]">{projectName}</p>
              </div>
              <Dialog.Close asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors">
                  <X size={14} className="text-zinc-500" />
                </button>
              </Dialog.Close>
            </div>

            {/* Invite form */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex gap-2">
                <div className="flex flex-1 items-center rounded-lg border border-zinc-200 focus-within:border-[#FA4500] transition-colors overflow-hidden">
                  <Mail size={14} className="ml-3 text-zinc-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    placeholder="Email address"
                    className="flex-1 py-2.5 px-2.5 text-[13px] outline-none bg-transparent placeholder:text-zinc-400"
                  />
                </div>

                {/* Role selector */}
                <div className="relative">
                  <button
                    onClick={() => setRoleOpen(!roleOpen)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2.5 text-[13px] hover:border-zinc-300 transition-colors whitespace-nowrap"
                  >
                    {selectedRole.label}
                    <ChevronDown size={12} className="text-zinc-400" />
                  </button>
                  <AnimatePresence>
                    {roleOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-full mt-1 z-10 w-44 rounded-lg border border-zinc-100 bg-white shadow-lg overflow-hidden"
                      >
                        {ROLES.map(r => (
                          <button
                            key={r.value}
                            onClick={() => { setRole(r.value); setRoleOpen(false); }}
                            className={cn(
                              'w-full px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors',
                              role === r.value && 'bg-orange-50'
                            )}
                          >
                            <div className="text-[13px] font-medium text-zinc-900">{r.label}</div>
                            <div className="text-[11px] text-zinc-500">{r.desc}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleInvite}
                  disabled={sending || !email.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FA4500] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#e03e00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  <UserPlus size={13} />
                  {sending ? 'Sending...' : 'Invite'}
                </button>
              </div>

              {/* Success / error feedback */}
              <AnimatePresence>
                {sentEmail && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-2 text-[12px] text-emerald-600"
                  >
                    ✓ Invite sent to {sentEmail}
                  </motion.p>
                )}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-2 text-[12px] text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Collaborators list */}
            {collaborators.length > 0 && (
              <div className="border-t border-zinc-100 px-6 py-4 max-h-48 overflow-y-auto">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">People with access</p>
                <div className="space-y-2">
                  {collaborators.map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
                          {c.profiles?.full_name?.[0]?.toUpperCase() ?? c.invite_email?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-zinc-900">
                            {c.profiles?.full_name ?? c.invite_email ?? 'Unknown'}
                          </div>
                          <div className="text-[11px] text-zinc-400 capitalize">{c.status}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-500 capitalize bg-zinc-100 px-2 py-0.5 rounded">{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Copy link */}
            <div className="border-t border-zinc-100 px-6 py-4">
              <button
                onClick={copyLink}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-[13px] hover:border-zinc-300 transition-colors"
              >
                <span className="text-zinc-600 truncate max-w-[300px]">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/workspace/{projectId}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-500 shrink-0 ml-3">
                  {linkCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{linkCopied ? 'Copied!' : 'Copy link'}</span>
                </span>
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
