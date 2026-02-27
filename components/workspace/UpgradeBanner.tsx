'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, AlertTriangle, Sparkles } from 'lucide-react';
import type { UsageStats } from '@/lib/usage/tracker';

const DISMISS_KEY = 'argus:upgrade-banner-dismissed';

export default function UpgradeBanner() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  // Check sessionStorage for dismissed state on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === 'true') {
        setDismissed(true);
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  // Fetch usage data
  useEffect(() => {
    let cancelled = false;

    async function fetchUsage() {
      try {
        const res = await fetch('/api/user/usage');
        if (!res.ok) throw new Error('Failed to fetch usage');
        const data: UsageStats = await res.json();
        if (!cancelled) setUsage(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // sessionStorage not available
    }
  };

  // Don't render if: error, loading, dismissed, not free tier, or not approaching limit
  if (error || !usage || dismissed) return null;
  if (usage.tier !== 'free') return null;
  if (usage.buildsLimit === null) return null;

  const buildsUsed = usage.buildsThisMonth;
  const buildsLimit = usage.buildsLimit;

  // Show banner at 2+ out of 3 (approaching), or at limit
  const atLimit = buildsUsed >= buildsLimit;
  const approaching = buildsUsed >= buildsLimit - 1 && buildsUsed < buildsLimit;

  if (!atLimit && !approaching) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(255 247 237), white 40%, white 60%, rgb(255 247 237))',
        }}
      >
        {/* Orange gradient top border accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-300 via-[#FA4500] to-orange-300" />

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
            {atLimit ? (
              <AlertTriangle className="h-4 w-4 text-[#FA4500]" />
            ) : (
              <Sparkles className="h-4 w-4 text-orange-500" />
            )}
          </div>

          {/* Message */}
          <div className="min-w-0 flex-1">
            {atLimit ? (
              <p className="text-[13px] text-zinc-700">
                <span className="font-semibold text-zinc-900">
                  You&apos;ve used all {buildsLimit} free builds.
                </span>{' '}
                Upgrade to Pro to keep building.
              </p>
            ) : (
              <p className="text-[13px] text-zinc-700">
                <span className="font-semibold text-zinc-900">
                  You have {buildsLimit - buildsUsed} build
                  {buildsLimit - buildsUsed === 1 ? '' : 's'} left this month.
                </span>{' '}
                Upgrade to Pro for unlimited builds.
              </p>
            )}
          </div>

          {/* CTA button */}
          <a
            href="/account?billing=upgrade"
            className="flex shrink-0 items-center gap-1 rounded-lg bg-[#FA4500] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.97]"
          >
            Upgrade to Pro
            <ArrowUpRight className="h-3 w-3" />
          </a>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
