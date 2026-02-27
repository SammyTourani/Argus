'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/shadcn/separator';
import { SidebarTrigger } from '@/components/ui/shadcn/sidebar';

const BREADCRUMB_MAP: Record<string, string> = {
  '/workspace': 'Projects',
  '/account': 'Account Settings',
  '/marketplace': 'Model Marketplace',
  '/gallery': 'Gallery',
};

export default function AppHeader() {
  const pathname = usePathname();
  const pageTitle = BREADCRUMB_MAP[pathname || ''] || 'Argus';

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-[14px] font-semibold text-zinc-900">{pageTitle}</h1>
    </header>
  );
}
