'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Save, UserMinus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { MODELS as SHARED_MODELS } from '@/lib/models'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  description?: string
  default_model?: string
  default_style?: string
}

interface Collaborator {
  id: string
  user_id: string
  full_name: string
  email: string
  avatar_url?: string
  role: 'owner' | 'editor' | 'viewer'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS = SHARED_MODELS.map((m) => ({ value: m.id, label: m.name }))

const STYLE_PRESETS = [
  { value: 'modern', label: 'Modern', desc: 'Clean lines, minimal' },
  { value: 'playful', label: 'Playful', desc: 'Bold colors, rounded' },
  { value: 'corporate', label: 'Corporate', desc: 'Professional, muted' },
  { value: 'dark', label: 'Dark', desc: 'Dark bg, high contrast' },
  { value: 'brutalist', label: 'Brutalist', desc: 'Raw, typographic' },
  { value: 'glassmorphism', label: 'Glass', desc: 'Frosted, translucent' },
]

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-violet-100 text-violet-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-zinc-100 text-zinc-600',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string

  // Project state
  const [project, setProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savedGeneral, setSavedGeneral] = useState(false)

  // Collaborators state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer')
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Model/style state
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [savingModel, setSavingModel] = useState(false)
  const [savedModel, setSavedModel] = useState(false)

  // Danger zone
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Loading
  const [loading, setLoading] = useState(true)

  // ─── Fetch data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId) return

    async function loadData() {
      setLoading(true)
      try {
        const [projRes, collabRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/collaborators`),
        ])

        if (projRes.ok) {
          const data: Project = await projRes.json()
          setProject(data)
          setProjectName(data.name || '')
          setProjectDescription(data.description || '')
          setSelectedModel(data.default_model || 'gpt-4o')
          setSelectedStyle(data.default_style || 'modern')
        }

        if (collabRes.ok) {
          const data: Collaborator[] = await collabRes.json()
          setCollaborators(data)
          // Detect own role (assume first owner is us if no user context)
          const owner = data.find((c) => c.role === 'owner')
          if (owner) setCurrentUserRole(owner.role)
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleSaveGeneral() {
    setSavingGeneral(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      })
      setSavedGeneral(true)
      setTimeout(() => setSavedGeneral(false), 2500)
    } finally {
      setSavingGeneral(false)
    }
  }

  async function handleSaveModel() {
    setSavingModel(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_model: selectedModel, default_style: selectedStyle }),
      })
      setSavedModel(true)
      setTimeout(() => setSavedModel(false), 2500)
    } finally {
      setSavingModel(false)
    }
  }

  async function handleRemoveMember(collaboratorId: string) {
    setRemovingId(collaboratorId)
    try {
      await fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      })
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId))
    } finally {
      setRemovingId(null)
    }
  }

  async function handleDeleteProject() {
    setDeleting(true)
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      router.push('/workspace')
    } catch {
      setDeleting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href={`/workspace/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to project
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Project Settings</h1>

        {/* ── Section 1: General ─────────────────────────────────────────────── */}
        <section className="rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">General</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Project name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FA4500] focus:border-transparent"
                placeholder="My awesome project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FA4500] focus:border-transparent resize-none"
                placeholder="What's this project about?"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveGeneral}
                disabled={savingGeneral}
                className="flex items-center gap-1.5 rounded-lg bg-[#FA4500] px-4 py-2 text-sm font-medium text-white hover:bg-[#E03E00] disabled:opacity-50 transition-colors"
              >
                {savingGeneral ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {savedGeneral ? 'Saved!' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-zinc-500 mb-3">
              Permanently delete this project and all of its data. This cannot be undone.
            </p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Delete project
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-600">Are you sure?</span>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 2: Members ─────────────────────────────────────────────── */}
        <section className="rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Members</h2>

          {collaborators.length === 0 ? (
            <p className="text-sm text-zinc-400">No collaborators yet.</p>
          ) : (
            <ul className="space-y-3">
              {collaborators.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors"
                >
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-zinc-600">
                          {getInitials(member.full_name)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {member.full_name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Role badge + remove */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ROLE_COLORS[member.role] ?? 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {member.role}
                    </span>
                    {currentUserRole === 'owner' && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingId === member.id}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title={`Remove ${member.full_name}`}
                      >
                        {removingId === member.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UserMinus size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Section 3: Model & Style ───────────────────────────────────────── */}
        <section className="rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Model & Style</h2>

          {/* Model selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Default AI model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FA4500] focus:border-transparent"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style preset radio cards */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Default style preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setSelectedStyle(style.value)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selectedStyle === style.value
                      ? 'border-[#FA4500] bg-[#FA4500] text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <p className="text-xs font-semibold">{style.label}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      selectedStyle === style.value ? 'text-zinc-400' : 'text-zinc-400'
                    }`}
                  >
                    {style.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={handleSaveModel}
              disabled={savingModel}
              className="flex items-center gap-1.5 rounded-lg bg-[#FA4500] px-4 py-2 text-sm font-medium text-white hover:bg-[#E03E00] disabled:opacity-50 transition-colors"
            >
              {savingModel ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {savedModel ? 'Saved!' : 'Save defaults'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
