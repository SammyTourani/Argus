'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PresenceUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  color: string;
  last_seen: string;
}

const COLOR_PALETTE = [
  '#FA4500', '#3B82F6', '#10B981', '#8B5CF6',
  '#F59E0B', '#EF4444', '#06B6D4', '#EC4899',
];

function hashColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

interface TeamPresenceProps {
  projectId: string;
}

export default function TeamPresence({ projectId }: TeamPresenceProps) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let currentUserId: string | null = null;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId = user.id;

      const channel = supabase.channel(`project-presence-${projectId}`, {
        config: { presence: { key: user.id } },
      });

      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceUser>();
          const users: PresenceUser[] = Object.values(state)
            .flat()
            .filter((u) => u.user_id !== currentUserId)
            .map((u) => ({ ...u, color: hashColor(u.user_id) }));
          setPresenceUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              full_name: user.user_metadata?.full_name ?? user.email ?? null,
              avatar_url: user.user_metadata?.avatar_url ?? null,
              color: hashColor(user.id),
              last_seen: new Date().toISOString(),
            });
          }
        });
    };

    setup();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [projectId]);

  if (presenceUsers.length === 0) return null;

  const shown = presenceUsers.slice(0, 5);
  const overflow = presenceUsers.length - 5;

  return (
    <div className="flex items-center -space-x-2" title="People viewing this project">
      {shown.map((user) => (
        <div
          key={user.user_id}
          className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-110 hover:z-10"
          style={{ backgroundColor: user.color }}
          title={`${user.full_name ?? 'Anonymous'} is viewing`}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name ?? ''}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(user.full_name)
          )}
          {/* Online pulse dot */}
          <span
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white"
            style={{ backgroundColor: user.color }}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-300 text-[11px] font-bold text-zinc-600 shadow-sm">
          +{overflow}
        </div>
      )}
    </div>
  );
}
