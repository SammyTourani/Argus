'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Share2, Plus, Clock, Cpu, Settings } from 'lucide-react';
import ShareDialog from '@/components/workspace/ShareDialog';
import TeamPresence from '@/components/workspace/TeamPresence';
import InviteButton from '@/components/workspace/InviteButton';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Project, Build } from '@/types/workspace';

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

function BuildStatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string; bg: string; label: string }> = {
    complete: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Complete' },
    completed: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Complete' },
    building: { dot: 'bg-[#FA4500] animate-pulse', text: 'text-orange-700', bg: 'bg-orange-50', label: 'Building' },
    running: { dot: 'bg-[#FA4500] animate-pulse', text: 'text-orange-700', bg: 'bg-orange-50', label: 'Running' },
    pending: { dot: 'bg-zinc-400', text: 'text-zinc-600', bg: 'bg-zinc-100', label: 'Pending' },
    failed: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Failed' },
    error: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Error' },
  };
  const s = config[status?.toLowerCase()] || { dot: 'bg-zinc-400', text: 'text-zinc-600', bg: 'bg-zinc-100', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function BuildCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="aspect-video w-full animate-pulse bg-zinc-100" />
      <div className="px-3 py-2.5 space-y-2">
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const fetchProjectData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Fetch project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      router.push('/workspace');
      return;
    }

    setProject(projectData as Project);

    // Fetch builds for this project
    const { data: buildsData } = await supabase
      .from('project_builds')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    setBuilds((buildsData || []) as Build[]);
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const gradientPlaceholders = [
    'from-orange-400 to-rose-500',
    'from-violet-500 to-purple-600',
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Workspace
            </Link>
            <span className="text-zinc-300">/</span>
            {loading ? (
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
            ) : (
              <h1 className="text-[15px] font-bold text-zinc-900">
                {project?.name || 'Project'}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {project && <TeamPresence projectId={project.id} />}
            {project && (
              <InviteButton
                projectId={project.id}
                projectName={project.name}
              />
            )}
            {project && (
              <ShareDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                projectId={project.id}
                projectName={project.name}
              />
            )}
            <Link
              href={`/workspace/${projectId}/settings`}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        {/* Project description */}
        {!loading && project?.description && (
          <p className="mb-6 text-[14px] text-zinc-500">{project.description}</p>
        )}

        {/* Builds section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
            Builds
          </h2>
          <button
            onClick={() => router.push(`/workspace/${projectId}/build/new`)}
            className="flex items-center gap-1.5 rounded-lg bg-[#FA4500] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Build
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <BuildCardSkeleton key={i} />
            ))}
          </div>
        ) : builds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
              <Cpu className="h-7 w-7 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900">No builds yet</h3>
            <p className="mt-1.5 max-w-[280px] text-[14px] text-zinc-500">
              Start your first build to generate code with AI.
            </p>
            <button
              onClick={() => router.push(`/workspace/${projectId}/build/new`)}
              className="mt-5 rounded-lg bg-[#FA4500] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98]"
            >
              Start First Build
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {builds.map((build, index) => {
                const gradientIndex = index % gradientPlaceholders.length;
                return (
                  <motion.div
                    key={build.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => router.push(`/workspace/${projectId}/build/${build.id}`)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                      {build.preview_url ? (
                        <img
                          src={build.preview_url}
                          alt={build.title || `Build`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br opacity-80 ${gradientPlaceholders[gradientIndex]}`}>
                          <span className="text-2xl font-bold text-white/60">
                            #{builds.length - index}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2">
                        <BuildStatusBadge status={build.status} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5">
                      <h3 className="truncate text-[14px] font-bold text-zinc-900">
                        {build.title || `Build #${builds.length - index}`}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-[12px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(build.created_at)}
                        </span>
                        {build.model && (
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            {build.model}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
