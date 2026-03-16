'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/auth'

type UserContextType = {
  user: AuthUser | null
  refreshUser: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  refreshUser: () => {},
})

export function UserProvider({
  user: serverUser,
  children,
}: {
  user: AuthUser | null
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(serverUser)
  const router = useRouter()

  // Sync when server re-renders (e.g. after router.refresh())
  useEffect(() => {
    setUser(serverUser)
  }, [serverUser])

  // Listen for auth state changes (sign-out, token refresh)
  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null)
      if (event === 'TOKEN_REFRESHED') router.refresh()
    })
    return () => subscription.unsubscribe()
  }, [router])

  const refreshUser = () => router.refresh()

  return (
    <UserContext.Provider value={{ user, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
