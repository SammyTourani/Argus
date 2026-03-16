'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SubscriptionTier } from '@/lib/subscription/gate';

interface SubscriptionState {
  tier: SubscriptionTier;
  canBuild: boolean;
  canDeploy: boolean;
  canUseAllModels: boolean;
  canCollaborate: boolean;
  buildsRemaining: number | null;
  maxBuilds: number | null;
  creditsRemaining: number;
  creditsTotal: number;
  loading: boolean;
  error: string | null;
  openUpgrade: (plan?: 'pro' | 'team') => void;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [canBuild, setCanBuild] = useState(true);
  const [canDeploy, setCanDeploy] = useState(false);
  const [canUseAllModels, setCanUseAllModels] = useState(false);
  const [canCollaborate, setCanCollaborate] = useState(false);
  const [buildsRemaining, setBuildsRemaining] = useState<number | null>(3);
  const [maxBuilds, setMaxBuilds] = useState<number | null>(3);
  const [creditsRemaining, setCreditsRemaining] = useState(30);
  const [creditsTotal, setCreditsTotal] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/user/subscription');
      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in — keep defaults
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch subscription');
      }
      const data = await res.json();
      setTier(data.tier);
      setCanBuild(data.canBuild);
      setCanDeploy(data.canDeploy);
      setCanUseAllModels(data.canUseAllModels);
      setCanCollaborate(data.canCollaborate);
      setBuildsRemaining(data.buildsRemaining);
      setMaxBuilds(data.maxBuilds);
      setCreditsRemaining(data.creditsRemaining ?? 30);
      setCreditsTotal(data.creditsTotal ?? 30);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const openUpgrade = useCallback(async (plan: 'pro' | 'team' = 'pro') => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        // If not logged in, redirect to sign-up
        if (res.status === 401) {
          window.location.href = '/sign-up';
          return;
        }
        return;
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      // Fallback: redirect to account billing page
      window.location.href = '/account?billing=upgrade';
    }
  }, []);

  return {
    tier,
    canBuild,
    canDeploy,
    canUseAllModels,
    canCollaborate,
    buildsRemaining,
    maxBuilds,
    creditsRemaining,
    creditsTotal,
    loading,
    error,
    openUpgrade,
    refresh: fetchSubscription,
  };
}
