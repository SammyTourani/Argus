'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import ShareDialog from './ShareDialog'

interface InviteButtonProps {
  projectId: string
  projectName: string
}

export default function InviteButton({ projectId, projectName }: InviteButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
        aria-label="Invite collaborators"
      >
        <UserPlus size={15} className="text-zinc-500" />
        Invite
      </button>

      <ShareDialog
        projectId={projectId}
        projectName={projectName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
