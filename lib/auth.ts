import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type AuthUser = {
  id: string
  email: string
  name: string
  initial: string
}

/**
 * Server-side user fetcher wrapped in React.cache() for request-level deduplication.
 * Multiple server components calling getUser() in the same request only hit Supabase once.
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User'

  return {
    id: user.id,
    email: user.email || '',
    name,
    initial: (name || 'U').charAt(0).toUpperCase(),
  }
})
