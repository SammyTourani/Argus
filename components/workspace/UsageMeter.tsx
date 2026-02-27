'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowUpRight, CalendarClock } from 'lucide-react';
import type { UsageStats } from '@/lib/usage/tracker';

// ─── Circular Progress Ring ─────────────────────────────────────────────────

function ProgressRing({
  value,
  max,
  size = 56,
  strokeWidth = 5,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - ratio * circumference;

  // Color based on usage percentage
  let strokeColor = '#22c55e'; // green < 50%
  if (ratio >= 0.8) {
    strokeColor = '#ef4444'; // red > 80%
  } else if (ratio >= 0.5) {
    strokeColor = '#f59e0b'; // yellow 50-80%
  }

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e4e4e7"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UsageMeter() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState(false);

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

  // Hide gracefully on error
  if (error) return null;

  const isLoading = usage === null;
  const isFreeTier = usage?.tier === 'free';
  const hasLimit = usage?.buildsLimit !== null && usage?.buildsLimit !== undefined;
  const buildsUsed = usage?.buildsThisMonth ?? 0;
  const buildsLimit = usage?.buildsLimit ?? 0;
  const limitReached = hasLimit && buildsUsed >= buildsLimit;

  // Format reset date
  const resetLabel = usage?.resetDate
    ? new Date(usage.resetDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3"
    >
      {/* Progress ring or loading skeleton */}
      {isLoading ? (
        <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-100" />
      ) : hasLimit ? (
        <ProgressRing value={buildsUsed} max={buildsLimit} />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <Zap className="h-6 w-6 text-emerald-500" />
        </div>
      )}

      {/* Text content */}
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
          </div>
        ) : hasLimit ? (
          <>
            <p className="text-[14px] font-bold text-zinc-900">
              {buildsUsed}/{buildsLimit} builds used
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <CalendarClock className="h-3 w-3 text-zinc-400" />
              <p className="text-[12px] text-zinc-500">
                Resets {resetLabel}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-[14px] font-bold text-zinc-900">
              {buildsUsed} builds this month
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Unlimited on {usage?.tier === 'team' ? 'Team' : 'Pro'} plan
            </p>
          </>
        )}
      </div>

      {/* Upgrade button (only for free tier at limit) */}
      {!isLoading && isFreeTier && limitReached && (
        <a
          href="/account?billing=upgrade"
          className="flex shrink-0 items-center gap-1 rounded-lg bg-[#FA4500] px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-[#e03e00] active:scale-[0.97]"
        >
          Upgrade
          <ArrowUpRight className="h-3 w-3" />
        </a>
      )}
    </motion.div>
  );
}
