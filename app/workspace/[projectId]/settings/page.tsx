'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';
import GitHubConnectButton from '@/components/workspace/GitHubConnectButton';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import type { Project, ProjectCollaboratorWithProfile } from '@/types/database';

const MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Free)', provider: 'Groq' },
];

const STYLE_PRESETS = [
  { id: 'minimal', name: 'Minimal', swatch: '#F8F8F8', border: '#E0E0E0' },
  { id: 'bold', name: 'Bold', swatch: '#000000', border: '#000' },
  { id: 'enterprise', name: 'Enterprise', swatch: '#1E3A5F', border: '#1E3A5F' },
  { id: 'playful', name: 'Playful', swatch: '#FF85A1', border: '#FF85A1' },
  { id: 'dark', name: 'Dark', swatch: '#0A0A0A', border: '#333' },
  { id: 'brutalist', name: 'Brutalist', swatch: '#FFFF00', border: '#000' },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 mb-6">
      <h2 className="text-lg font-bold text-zinc-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [collaborators, setCollaborators] = useState<ProjectCollaboratorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultModel, setDefaultModel] = useState('claude-sonnet-4-6');
  const [defaultStyle, setDefaultStyle] = useState('minimal');

  const load = useCallback(async () => {
    const [projRes, collabRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/projects/${projectId}/collaborators`),
    ]);
    const projData = await projRes.json();
    const collabData = await collabRes.json();

    if (projData.project) {
      const p = projData.project as Project;
      setProject(p);
      setName(p.name);
      setDescription(p.description ?? '');
      setDefaultModel(p.default_model ?? 'claude-sonnet-4-6');
      setDefaultStyle(p.default_style ?? 'minimal');
    }
    setCollaborators(collabData.collaborators ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, default_model: defaultModel, default_style: defaultStyle }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== project?.name) return;
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    router.push('/workspace');
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    await fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, { method: 'DELETE' });
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Top nav */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-zinc-200 bg-white px-6">
        <Link
          href={`/workspace/${projectId}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to project
        </Link>
        <span className="mx-3 text-zinc-300">/</span>
        <span className="text-sm font-medium text-zinc-900 truncate max-w-[200px]">
          {project?.name ?? 'Settings'}
        </span>
        <span className="ml-2 text-sm text-zinc-400">· Settings</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Project Settings</h1>

        {/* General */}
        <SectionCard title="General">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Project name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-[#FA4500] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what this project is for..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-[#FA4500] focus:outline-none transition-colors resize-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
            </button>
          </div>
        </SectionCard>

        {/* Members */}
        <SectionCard title="Members">
          {collaborators.length === 0 ? (
            <p className="text-sm text-zinc-400">No collaborators yet. Invite someone from the project page.</p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                      {(c.profiles?.full_name ?? c.invite_email ?? '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">
                        {c.profiles?.full_name ?? c.invite_email ?? 'Unknown'}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {c.status === 'pending' ? '⏳ Invite pending' : `✓ ${c.role}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded capitalize">
                      {c.role}
                    </span>
                    <button
                      onClick={() => handleRemoveCollaborator(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Model defaults */}
        <SectionCard title="Default AI Model">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Model</label>
              <div className="space-y-2">
                {MODELS.map((m) => (
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
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Style preset</label>
              <div className="flex gap-2 flex-wrap">
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setDefaultStyle(s.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      defaultStyle === s.id ? 'border-[#FA4500] text-[#FA4500]' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                    )}
                  >
                    <span
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: s.swatch, border: `1px solid ${s.border}` }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save defaults'}
            </button>
          </div>
        </SectionCard>

        {/* GitHub Integration */}
        <SectionCard title="GitHub Integration">
          <GitHubConnectButton
            projectId={projectId}
            currentRepoUrl={(project as (Project & { github_repo_url?: string | null }))?.github_repo_url ?? null}
            onSynced={(url) => {
              setProject((prev) =>
                prev ? { ...prev, github_repo_url: url } as typeof prev : prev
              );
            }}
          />
        </SectionCard>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Permanently delete this project and all its builds. This cannot be undone.
          </p>
          <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
                Delete project
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-red-500" size={20} />
                  <Dialog.Title className="text-lg font-bold text-zinc-900">Delete project</Dialog.Title>
                </div>
                <p className="text-sm text-zinc-600 mb-4">
                  This will permanently delete <strong>{project?.name}</strong> and all its builds.
                  Type the project name to confirm.
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={project?.name}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm mb-4 focus:border-red-400 focus:outline-none"
                />
                <div className="flex gap-3 justify-end">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Cancel</button>
                  </Dialog.Close>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== project?.name}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete forever
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </div>
  );
}
