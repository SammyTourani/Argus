'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { X, Link2, Send } from 'lucide-react'

interface ShareDialogProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ShareDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const projectUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/workspace/${projectId}`
      : `/workspace/${projectId}`

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
      setEmail('')
      setTimeout(() => setSent(false), 3000)
    } catch {
      // no-op; stub
    } finally {
      setSending(false)
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(projectUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Share &ldquo;{projectName}&rdquo;
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
              <X size={16} />
            </Dialog.Close>
          </div>

          {/* Invite by email */}
          <form onSubmit={handleInvite} className="mb-4">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
                {sending ? 'Sending…' : sent ? 'Sent!' : 'Invite'}
              </button>
            </div>
          </form>

          {/* Copy link */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Or share a link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 truncate bg-zinc-50">
                {projectUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Link2 size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
