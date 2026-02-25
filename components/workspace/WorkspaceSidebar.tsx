'use client';

import { useState } from 'react';
import { LayoutGrid, Star, Users, Settings, Plus, ChevronDown, Zap, GalleryHorizontal, UserCircle, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WorkspaceView } from '@/types/workspace';

interface WorkspaceSidebarProps {
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  onNewProject: () => void;
  counts: {
    all: number;
    starred: number;
    shared: number;
  };
  userName?: string | null;
  /** Mobile: whether the drawer is open (controlled by parent) */
  mobileOpen?: boolean;
  /** Mobile: callback to close the drawer */
  onMobileClose?: () => void;
}

const navItems: { view: WorkspaceView; label: string; icon: typeof LayoutGrid }[] = [
  { view: 'all', label: 'All Projects', icon: LayoutGrid },
  { view: 'starred', label: 'Starred', icon: Star },
  { view: 'shared', label: 'Shared with me', icon: Users },
];

function SidebarContent({
  activeView,
  onViewChange,
  onNewProject,
  counts,
  userName,
  onAfterNav,
}: WorkspaceSidebarProps & { onAfterNav?: () => void }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const handleViewChange = (view: WorkspaceView) => {
    onViewChange(view);
    onAfterNav?.();
  };

  const handleNewProject = () => {
    onNewProject();
    onAfterNav?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Workspace header */}
      <div className="border-b border-zinc-100 px-4 py-4">
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#080808] text-[10px] font-bold text-white">
              A
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold tracking-tight text-zinc-900">ARGUS</p>
              <p className="text-[11px] text-zinc-500">{userName || 'My Workspace'}</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-zinc-400 transition-transform',
              workspaceOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            const count = counts[item.view];

            return (
              <button
                key={item.view}
                onClick={() => handleViewChange(item.view)}
                className={cn(
                  'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-orange-50/80 text-[#FA4500]'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#FA4500]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive ? 'text-[#FA4500]' : 'text-zinc-400 group-hover:text-zinc-600'
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      isActive
                        ? 'bg-[#FA4500]/10 text-[#FA4500]'
                        : 'bg-zinc-100 text-zinc-500'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explore links */}
        <div className="mt-6 border-t border-zinc-100 pt-3 space-y-0.5">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Explore</p>
          <Link
            href="/marketplace"
            onClick={onAfterNav}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <Zap className="h-4 w-4 text-zinc-400" />
            <span>Model Marketplace</span>
          </Link>
          <Link
            href="/gallery"
            onClick={onAfterNav}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <GalleryHorizontal className="h-4 w-4 text-zinc-400" />
            <span>Gallery</span>
          </Link>
        </div>

        {/* Account settings at bottom of nav */}
        <div className="mt-2 border-t border-zinc-100 pt-3 space-y-0.5">
          <Link
            href="/account"
            onClick={onAfterNav}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <UserCircle className="h-4 w-4 text-zinc-400" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* New Project button */}
      <div className="border-t border-zinc-100 p-3">
        <button
          onClick={handleNewProject}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>
    </div>
  );
}

export default function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const { mobileOpen = false, onMobileClose } = props;

  return (
    <>
      {/* ── Desktop sidebar (always visible on md+) ── */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[240px] flex-col border-r border-zinc-200 bg-white md:flex">
        <SidebarContent {...props} />
      </aside>

      {/* ── Mobile drawer (slide-in on < md) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-zinc-200 bg-white md:hidden"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>

              <SidebarContent {...props} onAfterNav={onMobileClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
