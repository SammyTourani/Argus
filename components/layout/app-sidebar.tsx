'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { navGroups } from '@/config/nav-config';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/shadcn/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';

interface AppSidebarProps {
  /** Counts for badge display on workspace nav items */
  counts?: { all: number; starred: number; shared: number };
  /** Callback when "New Project" is clicked */
  onNewProject?: () => void;
}

export default function AppSidebar({ counts, onNewProject }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || null);
        setUserEmail(user.email || null);
      }
    });
  }, []);

  const isActive = (url: string, matchExact?: boolean) => {
    // Handle URLs with query params (like /workspace?view=starred)
    const [path, query] = url.split('?');
    if (path !== pathname) return false;
    if (!query) return matchExact ? !searchParams?.get('view') : true;
    const params = new URLSearchParams(query);
    for (const [key, value] of params.entries()) {
      if (searchParams?.get(key) !== value) return false;
    }
    return true;
  };

  const getBadge = (url: string): number | null => {
    if (!counts) return null;
    if (url === '/workspace') return counts.all || null;
    if (url.includes('view=starred')) return counts.starred || null;
    if (url.includes('view=shared')) return counts.shared || null;
    return null;
  };

  return (
    <Sidebar collapsible="icon">
      {/* Brand header */}
      <SidebarHeader className="border-b border-zinc-100 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#080808] text-[11px] font-bold text-white">
            A
          </div>
          <div
            className={cn(
              'grid flex-1 text-left text-sm leading-tight transition-all duration-200',
              state === 'collapsed'
                ? 'invisible max-w-0 overflow-hidden opacity-0'
                : 'visible max-w-full opacity-100'
            )}
          >
            <span className="truncate text-[13px] font-bold tracking-tight text-zinc-900">
              ARGUS
            </span>
            <span className="truncate text-[11px] text-zinc-400">
              {userName || 'My Workspace'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url, item.matchExact);
                const badge = getBadge(item.url);

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        active && 'bg-orange-50/80 text-[#FA4500] hover:bg-orange-50 hover:text-[#FA4500]'
                      )}
                    >
                      <Link href={item.url}>
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            active ? 'text-[#FA4500]' : 'text-zinc-400'
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge !== null && (
                      <SidebarMenuBadge
                        className={cn(
                          'rounded-full px-1.5 text-[10px] font-semibold',
                          active
                            ? 'bg-[#FA4500]/10 text-[#FA4500]'
                            : 'bg-zinc-100 text-zinc-500'
                        )}
                      >
                        {badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-3 py-3">
        {/* New Project button */}
        {onNewProject && (
          <button
            onClick={onNewProject}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98]',
              state === 'collapsed' && 'px-0'
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                'transition-all duration-200',
                state === 'collapsed' ? 'hidden' : 'block'
              )}
            >
              New Project
            </span>
          </button>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FA4500] to-[#e03e00] text-[11px] font-bold text-white">
                {(userName || userEmail || 'U')[0].toUpperCase()}
              </div>
              <div
                className={cn(
                  'grid flex-1 text-left text-sm leading-tight transition-all duration-200',
                  state === 'collapsed'
                    ? 'invisible max-w-0 overflow-hidden opacity-0'
                    : 'visible max-w-full opacity-100'
                )}
              >
                <span className="truncate text-[12px] font-medium text-zinc-900">
                  {userName || 'User'}
                </span>
                <span className="truncate text-[11px] text-zinc-400">
                  {userEmail || ''}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'ml-auto h-3.5 w-3.5 text-zinc-400 transition-all duration-200',
                  state === 'collapsed' ? 'hidden' : 'block'
                )}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            align="end"
            side="top"
            sideOffset={8}
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-zinc-900">{userName || 'User'}</p>
              <p className="text-xs text-zinc-400">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account" className="cursor-pointer">
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-600"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
