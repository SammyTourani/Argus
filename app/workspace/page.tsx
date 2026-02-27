'use client';

import { useState, useMemo, Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { createClient } from '@/lib/supabase/client';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import ProjectCard from '@/components/workspace/ProjectCard';
import NewProjectCard from '@/components/workspace/NewProjectCard';
import NewProjectDialog from '@/components/workspace/NewProjectDialog';
import UsageStatsBar from '@/components/workspace/UsageStatsBar';
import UsageMeter from '@/components/workspace/UsageMeter';
import UpgradeBanner from '@/components/workspace/UpgradeBanner';
import QuickActionsBar from '@/components/workspace/QuickActionsBar';
import RecentActivity from '@/components/workspace/RecentActivity';
import ProjectSortDropdown from '@/components/workspace/ProjectSortDropdown';
import type { SortOption } from '@/components/workspace/ProjectSortDropdown';
import type { CloneData } from '@/components/workspace/NewProjectDialog';
import type { Project, WorkspaceView } from '@/types/workspace';

// Gallery items for clone-by-id lookup (matches gallery page data)
const GALLERY_ITEMS: Record<string, { name: string; desc: string }> = {
  '1': { name: 'SaaS Landing Page', desc: 'Clean SaaS landing with pricing and testimonials' },
  '2': { name: 'Analytics Dashboard', desc: 'Real-time analytics dashboard with charts' },
  '3': { name: 'E-commerce Store', desc: 'Full product catalog with cart and checkout' },
  '4': { name: 'Portfolio Site', desc: 'Minimal portfolio with project showcases' },
  '5': { name: 'Social Network', desc: 'Twitter-like social platform with feeds' },
  '6': { name: 'Task Manager', desc: 'Kanban-style project management tool' },
  '7': { name: 'Food Delivery App', desc: 'Restaurant ordering with live tracking' },
  '8': { name: 'Crypto Tracker', desc: 'Portfolio tracker with price alerts' },
  '9': { name: 'Blog Platform', desc: 'CMS with markdown editor and comments' },
  '10': { name: 'Booking System', desc: 'Appointment scheduler with calendar sync' },
  '11': { name: 'AI Chat Interface', desc: 'Custom ChatGPT interface with personas' },
  '12': { name: 'Learning Platform', desc: 'Course platform with video + quizzes' },
};

// Loading skeleton for project cards
function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="aspect-video w-full animate-pulse bg-zinc-100" />
      <div className="px-3 py-2.5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}

// Empty state component — branded, dramatic
function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {/* ASCII branding */}
      <div className="relative mb-8">
        <pre className="text-[#FA4500] text-[9px] font-mono opacity-30 leading-tight select-none">
{`    _    ____   ____ _   _ ____
   / \\  |  _ \\ / ___| | | / ___|
  / _ \\ | |_) | |  _| | | \\___ \\
 / ___ \\|  _ <| |_| | |_| |___) |
/_/   \\_\\_| \\_\\\\____|\\___/|____/`}
        </pre>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent" />
      </div>

      {/* Illustration: stylized browser window */}
      <div className="w-[280px] mb-8 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-100 bg-zinc-50/50">
          <div className="w-2 h-2 rounded-full bg-zinc-300" />
          <div className="w-2 h-2 rounded-full bg-zinc-300" />
          <div className="w-2 h-2 rounded-full bg-zinc-300" />
          <div className="flex-1 mx-2 h-4 rounded bg-zinc-100" />
        </div>
        <div className="p-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-[#FA4500]/10" />
          <div className="h-3 w-1/2 rounded bg-zinc-100" />
          <div className="h-8 w-full rounded bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center">
            <span className="text-[10px] text-zinc-400 font-mono">your-site.com</span>
          </div>
          <div className="flex gap-1.5 pt-1">
            <div className="h-2 w-2 rounded-full bg-[#FA4500]/30" />
            <div className="h-2 flex-1 rounded bg-zinc-100" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400/30" />
            <div className="h-2 w-2/3 rounded bg-zinc-100" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-zinc-900 tracking-tight">No projects yet</h3>
      <p className="mt-2 max-w-[340px] text-[14px] text-zinc-500 leading-relaxed">
        Clone any website with AI or start from a blank canvas. Argus handles the rest.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onCreateProject}
          className="rounded-xl bg-[#FA4500] px-7 py-3 text-[14px] font-semibold text-white shadow-md shadow-[#FA4500]/20 transition-all hover:bg-[#e03e00] hover:shadow-lg hover:shadow-[#FA4500]/30 active:scale-[0.97]"
        >
          Create your first project
        </button>
        <span className="text-[12px] text-zinc-400 font-mono">or press N</span>
      </div>
    </motion.div>
  );
}

function WorkspacePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cloneData, setCloneData] = useState<CloneData | null>(null);

  // Handle ?clone=<galleryId> — open new project dialog pre-filled with gallery data
  useEffect(() => {
    const cloneId = searchParams?.get('clone');
    if (cloneId) {
      const item = GALLERY_ITEMS[cloneId];
      if (item) {
        setCloneData({ name: item.name, description: item.desc });
      }
      setDialogOpen(true);
    }
  }, [searchParams]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('last-modified');

  // Helpers for opening dialog in specific modes
  const openDialogBlank = useCallback(() => {
    setCloneData(null);
    setDialogOpen(true);
  }, []);

  const openDialogClone = useCallback(() => {
    setCloneData({ source_url: '' });
    setDialogOpen(true);
  }, []);

  const openDialogTemplate = useCallback(() => {
    setCloneData(null);
    setDialogOpen(true);
  }, []);

  // Fetch projects from API (not directly from Supabase)
  const fetchProjects = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    setUserName(user.user_metadata?.full_name || user.email || null);

    try {
      const res = await fetch('/api/projects');
      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }
      if (!res.ok) {
        console.error('Failed to fetch projects:', res.status);
        setProjects([]);
      } else {
        const { projects } = await res.json();
        setProjects((projects || []) as Project[]);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setProjects([]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // 'N' key opens new project dialog (only when not in an input)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          setDialogOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Star toggle (optimistic)
  const handleStarToggle = useCallback(async (projectId: string, starred: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, is_starred: starred } : p))
    );
    const supabase = createClient();
    await supabase.from('projects').update({ is_starred: starred }).eq('id', projectId);
  }, []);

  // Duplicate project
  const handleDuplicate = useCallback(async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('projects').insert({
      name: `${project.name} (copy)`,
      description: project.description,
      created_by: user.id,
      status: 'active',
      is_starred: false,
    });

    if (!error) fetchProjects();
  }, [projects, fetchProjects]);

  // Delete project
  const handleDelete = useCallback(async (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    const supabase = createClient();
    await supabase.from('projects').delete().eq('id', projectId);
  }, []);

  // Filter projects based on view & search
  const filteredProjects = projects.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    switch (activeView) {
      case 'starred':
        return p.is_starred;
      case 'shared':
        return (p.project_collaborators?.length ?? 0) > 0;
      default:
        return true;
    }
  });

  const starredProjects = projects.filter((p) => p.is_starred);

  // Sort filtered projects based on selected sort option
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'created-newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'created-oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'last-modified':
      default:
        sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
    }
    return sorted;
  }, [filteredProjects, sortBy]);

  const recentProjects = sortedProjects;

  const counts = {
    all: projects.length,
    starred: projects.filter((p) => p.is_starred).length,
    shared: projects.filter((p) => (p.project_collaborators?.length ?? 0) > 0).length,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <WorkspaceSidebar
        activeView={activeView}
        onViewChange={(v) => { setActiveView(v); setMobileSidebarOpen(false); }}
        onNewProject={() => { setDialogOpen(true); setMobileSidebarOpen(false); }}
        counts={counts}
        userName={userName}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content (offset by sidebar on desktop only) */}
      <main className="md:pl-[240px]">
        {/* Top nav bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[15px] font-bold tracking-tight text-zinc-900">
              {activeView === 'all' && 'All Projects'}
              {activeView === 'starred' && 'Starred'}
              {activeView === 'shared' && 'Shared with me'}
            </h1>
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 text-[13px] text-zinc-400 transition-all hover:border-zinc-300 hover:bg-white hover:text-zinc-600 hover:shadow-sm"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search projects...</span>
            <kbd className="ml-4 hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:block">
              ⌘K
            </kbd>
          </button>

          {/* User avatar + settings */}
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Account settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FA4500] to-[#e03e00] text-[12px] font-bold text-white shadow-sm transition-transform hover:scale-105">
              {(userName || 'U')[0].toUpperCase()}
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          {loading ? (
            /* Loading skeleton */
            <div className="space-y-6">
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100" />
                    <div className="space-y-1">
                      <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-100" />
                      <div className="h-5 w-10 animate-pulse rounded bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Cards skeleton */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onCreateProject={() => setDialogOpen(true)} />
          ) : (
            <div className="space-y-6">
              {/* Upgrade Banner (free tier, approaching/at limit) */}
              <UpgradeBanner />

              {/* Usage Stats Bar */}
              <UsageStatsBar />

              {/* Usage Meter (builds used / limit) */}
              <UsageMeter />

              {/* Quick Actions Bar */}
              <QuickActionsBar
                onNewProject={openDialogBlank}
                onCloneUrl={openDialogClone}
                onImportGithub={openDialogTemplate}
              />

              {/* Recent Activity (collapsible) */}
              <RecentActivity />

              {/* Starred section (only on 'all' view) */}
              {activeView === 'all' && starredProjects.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                      Starred ({starredProjects.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {starredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onStarToggle={handleStarToggle}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Recent / Main grid */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                    {activeView === 'all' ? `Recent (${recentProjects.length})` : activeView === 'starred' ? `Starred (${recentProjects.length})` : `Shared (${recentProjects.length})`}
                  </h2>
                  <ProjectSortDropdown value={sortBy} onChange={setSortBy} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <NewProjectCard onClick={() => setDialogOpen(true)} />
                  <AnimatePresence mode="popLayout">
                    {recentProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onStarToggle={handleStarToggle}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* New project dialog */}
      <NewProjectDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setCloneData(null); }} initialData={cloneData} />

      {/* Search dialog (⌘K) */}
      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <AnimatePresence>
            {searchOpen && (
              <>
                <Dialog.Overlay asChild>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                  />
                </Dialog.Overlay>
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="fixed left-1/2 top-[20%] z-50 w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl"
                  >
                    <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
                      <Search className="h-4 w-4 text-zinc-400" />
                      <Dialog.Title className="sr-only">Search projects</Dialog.Title>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        autoFocus
                        className="flex-1 bg-transparent text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                      />
                      <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        ESC
                      </kbd>
                    </div>
                    {searchQuery && (
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {filteredProjects.length === 0 ? (
                          <p className="py-6 text-center text-[13px] text-zinc-500">
                            No projects found for &ldquo;{searchQuery}&rdquo;
                          </p>
                        ) : (
                          filteredProjects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                                router.push(`/workspace/${project.id}`);
                              }}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-50"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-[12px] font-bold text-zinc-500">
                                {project.name[0]?.toUpperCase() || 'A'}
                              </div>
                              <div>
                                <p className="text-[13px] font-medium text-zinc-900">{project.name}</p>
                                {project.description && (
                                  <p className="text-[12px] text-zinc-500">{project.description}</p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                </Dialog.Content>
              </>
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FA4500] border-t-transparent" />
      </div>
    }>
      <WorkspacePageInner />
    </Suspense>
  );
}
