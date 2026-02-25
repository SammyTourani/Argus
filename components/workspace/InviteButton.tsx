'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShareDialog from './ShareDialog';

interface InviteButtonProps {
  projectId: string;
  projectName: string;
  variant?: 'default' | 'ghost';
  className?: string;
}

export default function InviteButton({
  projectId,
  projectName,
  variant = 'default',
  className,
}: InviteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
          variant === 'default'
            ? 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            : 'text-zinc-500 hover:text-zinc-900',
          className
        )}
      >
        <UserPlus size={14} />
        Invite
      </button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        projectName={projectName}
      />
    </>
  );
}
