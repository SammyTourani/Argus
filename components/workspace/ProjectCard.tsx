'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MoreHorizontal, Pencil, Copy, Trash2, Settings } from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Project, Collaborator } from '@/types/workspace';

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const config = {
    active: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Active' },
    building: { dot: 'bg-[#FA4500] animate-pulse', text: 'text-orange-700', bg: 'bg-orange-50', label: 'Building' },
    archived: { dot: 'bg-zinc-400', text: 'text-zinc-600', bg: 'bg-zinc-100', label: 'Archived' },
  };
  const s = config[status] || config.active;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', s.bg, s.text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

function CollaboratorAvatars({ collaborators }: { collaborators: Collaborator[] }) {
  const shown = collaborators.slice(0, 4);
  const overflow = collaborators.length - 4;

  if (shown.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((c) => (
        <div
          key={c.id}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-zinc-200 text-[8px] font-bold text-zinc-600"
          title={c.full_name || c.email || 'Collaborator'}
        >
          {c.avatar_url ? (
            <img src={c.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            (c.full_name || 'U')[0].toUpperCase()
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-zinc-300 text-[8px] font-bold text-zinc-600">
          +{overflow}
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onStarToggle: (projectId: string, starred: boolean) => void;
  onDuplicate?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
}

export default function ProjectCard({ project, onStarToggle, onDuplicate, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(project.is_starred);
  const [isHovered, setIsHovered] = useState(false);

  const collaborators: Collaborator[] = (project.project_collaborators || [])
    .map((pc) => pc.profiles)
    .filter(Boolean);

  const handleStarClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newStarred = !isStarred;
      setIsStarred(newStarred); // optimistic
      onStarToggle(project.id, newStarred);
    },
    [isStarred, onStarToggle, project.id]
  );

  const handleCardClick = useCallback(() => {
    router.push(`/workspace/${project.id}`);
  }, [router, project.id]);

  const gradientPlaceholders = [
    'from-orange-400 to-rose-500',
    'from-violet-500 to-purple-600',
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
  ];

  const gradientIndex = project.id.charCodeAt(0) % gradientPlaceholders.length;

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <motion.div
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
            {project.thumbnail_url ? (
              <img
                src={project.thumbnail_url}
                alt={project.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center bg-gradient-to-br opacity-80',
                  gradientPlaceholders[gradientIndex]
                )}
              >
                <span className="text-3xl font-bold text-white/60">
                  {project.name[0]?.toUpperCase() || 'A'}
                </span>
              </div>
            )}

            {/* Star button */}
            <button
              onClick={handleStarClick}
              className={cn(
                'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-all',
                isStarred
                  ? 'bg-yellow-400/90 text-white shadow-sm'
                  : 'bg-black/20 text-white/80 opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:bg-black/40'
              )}
            >
              <Star className={cn('h-3.5 w-3.5', isStarred && 'fill-current')} />
            </button>

            {/* Status badge overlay */}
            <div className="absolute bottom-2 left-2">
              <StatusBadge status={project.status} />
            </div>
          </div>

          {/* Info */}
          <div className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-bold text-zinc-900">
                  {project.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  Last edited {timeAgo(project.updated_at)}
                </p>
              </div>
              <CollaboratorAvatars collaborators={collaborators} />
            </div>
          </div>
        </motion.div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[180px] overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-xl"
        >
          <ContextMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-700 outline-none hover:bg-zinc-50"
            onSelect={handleCardClick}
          >
            <Pencil className="h-3.5 w-3.5 text-zinc-400" />
            Edit
          </ContextMenu.Item>
          <ContextMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-700 outline-none hover:bg-zinc-50"
            onSelect={() => onDuplicate?.(project.id)}
          >
            <Copy className="h-3.5 w-3.5 text-zinc-400" />
            Duplicate
          </ContextMenu.Item>
          <ContextMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-700 outline-none hover:bg-zinc-50"
            onSelect={() => router.push(`/workspace/${project.id}/settings`)}
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            Settings
          </ContextMenu.Item>
          <ContextMenu.Separator className="my-1 h-px bg-zinc-100" />
          <ContextMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-red-600 outline-none hover:bg-red-50"
            onSelect={() => onDelete?.(project.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
