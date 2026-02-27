'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GitHubStatus {
  connected: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;
  reconnect: () => void;
  refresh: () => void;
}

const SESSION_KEY = 'argus_github_status';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedStatus {
  connected: boolean;
  username: string | null;
  timestamp: number;
}

function getCached(): CachedStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStatus;
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(connected: boolean, username: string | null) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ connected, username, timestamp: Date.now() } satisfies CachedStatus)
    );
  } catch {
    // sessionStorage full or unavailable
  }
}

export function useGitHubStatus(): GitHubStatus {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (skipCache = false) => {
    // Try cache first
    if (!skipCache) {
      const cached = getCached();
      if (cached) {
        setConnected(cached.connected);
        setUsername(cached.username);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/github/repos?per_page=1&page=1');
      if (res.ok) {
        // Extract username from first repo's full_name (owner/repo -> owner)
        const data = await res.json();
        let ghUsername: string | null = null;
        if (data.repos && data.repos.length > 0) {
          const fullName = data.repos[0].full_name as string;
          ghUsername = fullName.split('/')[0] ?? null;
        }
        setConnected(true);
        setUsername(ghUsername);
        setCache(true, ghUsername);
      } else if (res.status === 401) {
        const data = await res.json();
        if (data.code === 'GITHUB_NOT_CONNECTED' || data.code === 'GITHUB_TOKEN_EXPIRED') {
          setConnected(false);
          setUsername(null);
          setCache(false, null);
        } else {
          // Auth error (not logged in at all)
          setConnected(false);
          setUsername(null);
        }
      } else {
        setError('Failed to check GitHub status');
        setConnected(false);
        setUsername(null);
      }
    } catch {
      setError('Network error');
      setConnected(false);
      setUsername(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const reconnect = useCallback(() => {
    const supabase = createClient();
    // Clear cache before reconnecting
    sessionStorage.removeItem(SESSION_KEY);
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(window.location.pathname)}`,
        scopes: 'repo',
      },
    });
  }, []);

  const refresh = useCallback(() => {
    check(true);
  }, [check]);

  return { connected, username, loading, error, reconnect, refresh };
}
