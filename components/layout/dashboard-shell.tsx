'use client';

import { Suspense } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/shadcn/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';

interface DashboardShellProps {
  children: React.ReactNode;
  /** Counts for sidebar badges */
  counts?: { all: number; starred: number; shared: number };
  /** Callback when "New Project" is clicked in sidebar */
  onNewProject?: () => void;
}

export default function DashboardShell({
  children,
  counts,
  onNewProject,
}: DashboardShellProps) {
  return (
    <Suspense>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar counts={counts} onNewProject={onNewProject} />
        <SidebarInset>
          <AppHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  );
}
