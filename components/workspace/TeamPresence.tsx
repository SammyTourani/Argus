'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceUser {
  user_id: string
  full_name: string
  avatar_url?: string
  color: string
  last_seen: string
  is_typing?: boolean
}

interface TeamPresenceProps {
  projectId: string
}

const COLOR_PALETTE = [
  '#FA4500',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
]

function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return hash
}

function getColorForUser(userId: string): string {
  return COLOR_PALETTE[hashUserId(userId) % COLOR_PALETTE.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function TeamPresence({ projectId }: TeamPresenceProps) {
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([])
  const supabase = createClient()

  useEffect(() => {
    let currentUserId: string | null = null

    async function setupPresence() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      currentUserId = user.id
      const userColor = getColorForUser(user.id)
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Anonymous'
      const avatarUrl = user.user_metadata?.avatar_url || ''

      const channel = supabase.channel(`project-presence-${projectId}`, {
        config: { presence: { key: user.id } },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<Omit<PresenceUser, 'user_id'>>()
          const users: PresenceUser[] = Object.entries(state).map(([uid, presences]) => {
            const latest = presences[presences.length - 1]
            return {
              user_id: uid,
              full_name: latest.full_name || 'Unknown',
              avatar_url: latest.avatar_url,
              color: latest.color || getColorForUser(uid),
              last_seen: latest.last_seen || new Date().toISOString(),
              is_typing: latest.is_typing || false,
            }
          })
          setPresentUsers(users)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const p = newPresences[0]
          setPresentUsers((prev) => {
            const filtered = prev.filter((u) => u.user_id !== key)
            return [
              ...filtered,
              {
                user_id: key,
                full_name: p.full_name || 'Unknown',
                avatar_url: p.avatar_url,
                color: p.color || getColorForUser(key),
                last_seen: p.last_seen || new Date().toISOString(),
                is_typing: p.is_typing || false,
              },
            ]
          })
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setPresentUsers((prev) => prev.filter((u) => u.user_id !== key))
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              full_name: fullName,
              avatar_url: avatarUrl,
              color: userColor,
              last_seen: new Date().toISOString(),
              is_typing: false,
            })
          }
        })

      return () => {
        channel.unsubscribe()
      }
    }

    const cleanupPromise = setupPresence()

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [projectId])

  const MAX_VISIBLE = 5
  const visibleUsers = presentUsers.slice(0, MAX_VISIBLE)
  const overflowCount = presentUsers.length - MAX_VISIBLE

  if (presentUsers.length === 0) return null

  return (
    <div className="flex items-center -space-x-2" aria-label="People currently viewing this project">
      {visibleUsers.map((user) => (
        <div
          key={user.user_id}
          className="relative flex-shrink-0"
          title={`${user.full_name} is viewing`}
        >
          {/* Outer ring with user color */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              boxShadow: `0 0 0 2px ${user.color}, 0 0 0 3px white`,
            }}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold select-none"
                style={{ backgroundColor: user.color }}
              >
                {getInitials(user.full_name)}
              </div>
            )}
          </div>

          {/* Pulse ring when actively typing/building */}
          {user.is_typing && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ backgroundColor: user.color }}
            />
          )}
        </div>
      ))}

      {overflowCount > 0 && (
        <div
          className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-zinc-600 text-xs font-semibold select-none z-10"
          title={`${overflowCount} more people viewing`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  )
}
