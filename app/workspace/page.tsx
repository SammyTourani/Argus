'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { createClient } from '@/lib/supabase/client';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import ProjectCard from '@/components/workspace/ProjectCard';
import NewProjectCard from '@/components/workspace/NewProjectCard';
import NewProjectDialog from '@/components/workspace/NewProjectDialog';
import type { Project, WorkspaceView } from '@/types/workspace';

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

// Empty state component
function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="32" height="24" rx="4" stroke="#d4d4d8" strokeWidth="2" />
          <path d="M16 20H24M20 16V24" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="mt-5 text-lg font-bold text-zinc-900">No projects yet</h3>
      <p className="mt-1.5 max-w-[300px] text-[14px] text-zinc-500">
        Create your first project to start building with AI. Clone a website or start from scratch.
      </p>
      <button
        onClick={onCreateProject}
        className="mt-6 rounded-lg bg-[#FA4500] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98]"
      >
        Create your first project
      </button>
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

  // Handle ?clone=<galleryId> — open new project dialog automatically
  useEffect(() => {
    if (searchParams?.get('clone')) {
      setDialogOpen(true);
    }
  }, [searchParams]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const recentProjects = filteredProjects;

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
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
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
              {activeView === 'starred' && '⭐ Starred'}
              {activeView === 'shared' && 'Shared with me'}
            </h1>
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search projects...</span>
            <kbd className="ml-4 hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:block">
              ⌘K
            </kbd>
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[12px] font-bold text-zinc-600 transition-colors hover:bg-zinc-300">
              {(userName || 'U')[0].toUpperCase()}
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          {loading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onCreateProject={() => setDialogOpen(true)} />
          ) : (
            <div className="space-y-8">
              {/* Starred section (only on 'all' view) */}
              {activeView === 'all' && starredProjects.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                    ⭐ Starred
                  </h2>
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
                <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                  {activeView === 'all' ? '📅 Recent' : activeView === 'starred' ? '⭐ Starred' : '👥 Shared'}
                </h2>
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
      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />

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
