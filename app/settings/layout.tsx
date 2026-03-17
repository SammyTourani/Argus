'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, Users, Key, Plug, UserCircle } from 'lucide-react';
import { getActiveTeamId, onWorkspaceChange } from '@/lib/workspace/active-workspace';
import DashboardShell from '@/components/layout/dashboard-shell';
import { cn } from '@/lib/utils';

const TEAM_SECTIONS = [
  { id: 'general', label: 'General', icon: Settings, href: '/settings/general' },
  { id: 'members', label: 'Members', icon: Users, href: '/settings/members' },
  { id: 'api-keys', label: 'API Keys', icon: Key, href: '/settings/api-keys' },
  { id: 'connectors', label: 'Connectors', icon: Plug, href: '/settings/connectors' },
  { id: 'account', label: 'Your Account', icon: UserCircle, href: '/settings/account' },
];

const PERSONAL_SECTIONS = [
  { id: 'api-keys', label: 'API Keys', icon: Key, href: '/settings/api-keys' },
  { id: 'connectors', label: 'Connectors', icon: Plug, href: '/settings/connectors' },
  { id: 'account', label: 'Your Account', icon: UserCircle, href: '/settings/account' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTeamId(getActiveTeamId());
    setMounted(true);
    const cleanup = onWorkspaceChange(() => {
      setTeamId(getActiveTeamId());
    });
    return cleanup;
  }, []);

  const sections = teamId ? TEAM_SECTIONS : PERSONAL_SECTIONS;
  const activeSection = sections.find(s => pathname.startsWith(s.href))?.id || sections[0].id;

  if (!mounted) {
    return (
      <DashboardShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-zinc-400 text-sm animate-pulse">Loading...</div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        <aside className="md:w-48 shrink-0">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-3">Settings</h2>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-20 pb-2 md:pb-0">
            {sections.map(s => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className={cn(
                    'flex items-center gap-2 md:gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0',
                    isActive ? 'bg-orange-50 text-[#FA4500]' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <Icon size={15} className={isActive ? 'text-[#FA4500]' : 'text-zinc-400'} />
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </DashboardShell>
  );
}
