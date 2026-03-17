'use client';

import { useState } from 'react';
import { X, Zap, Lock } from 'lucide-react';
import type { SubscriptionTier } from '@/lib/subscription/gate';
import { cn } from '@/lib/utils';
import { getActiveTeamId } from '@/lib/workspace/active-workspace';

interface UpgradePromptProps {
  feature: string; // e.g., "deploy", "premium models", "more builds"
  currentTier: SubscriptionTier;
  inline?: boolean; // true = small inline banner, false = modal overlay
  dark?: boolean; // true = dark theme (builder), false = light theme (dashboard)
  onDismiss?: () => void;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
};

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  deploy: {
    title: 'Deploy to Vercel',
    description: 'Push your builds to production with one click. Available on Pro and above.',
  },
  'premium models': {
    title: 'All AI Models',
    description: 'Access all 9 AI models with Pro credits. Available on Pro and above.',
  },
  'more builds': {
    title: 'More Credits',
    description: 'You\'ve used all your credits. Upgrade to Pro for 300 credits/month.',
  },
  collaborate: {
    title: 'Team Collaboration',
    description: 'Invite team members and share projects. Available on Team and above.',
  },
};

export function UpgradePrompt({
  feature,
  currentTier,
  inline = false,
  dark = false,
  onDismiss,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const msg = FEATURE_MESSAGES[feature] ?? {
    title: `Unlock ${feature}`,
    description: `This feature requires a higher plan. You are currently on ${TIER_LABELS[currentTier]}.`,
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', ...(getActiveTeamId() ? { team_id: getActiveTeamId() } : {}) }),
      });
      if (res.status === 401) {
        window.location.href = '/sign-up';
        return;
      }
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      window.location.href = '/account';
    }
  };

  // ── Inline banner variant ──────────────────────────────────────────────
  if (inline) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border px-4 py-3',
          dark
            ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200'
            : 'bg-orange-50 border-[#FA4500]/20 text-zinc-800'
        )}
      >
        <Lock size={16} className={dark ? 'text-orange-400 shrink-0' : 'text-[#FA4500] shrink-0'} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', dark ? 'text-zinc-100' : 'text-zinc-900')}>
            {msg.title}
          </p>
          <p className={cn('text-xs mt-0.5', dark ? 'text-zinc-400' : 'text-zinc-500')}>
            {msg.description}
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          className={cn(
            'shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            dark
              ? 'bg-[#FA4500] text-white hover:bg-[#e03e00]'
              : 'bg-[#FA4500] text-white hover:bg-[#e03e00]'
          )}
        >
          <Zap size={12} />
          Upgrade
        </button>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={cn(
              'shrink-0 p-1 rounded transition-colors',
              dark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  // ── Modal overlay variant ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          'relative w-full max-w-md mx-4 rounded-2xl p-8 shadow-2xl',
          dark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={cn(
            'absolute top-4 right-4 p-1.5 rounded-lg transition-colors',
            dark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
          )}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl mb-5',
          dark ? 'bg-[#FA4500]/20' : 'bg-orange-100'
        )}>
          <Lock size={22} className="text-[#FA4500]" />
        </div>

        {/* Content */}
        <h3 className={cn(
          'text-xl font-bold mb-2',
          dark ? 'text-white' : 'text-zinc-900'
        )}>
          {msg.title}
        </h3>
        <p className={cn(
          'text-sm mb-6 leading-relaxed',
          dark ? 'text-zinc-400' : 'text-zinc-500'
        )}>
          {msg.description}
        </p>

        {/* Current plan indicator */}
        <div className={cn(
          'rounded-lg p-3 mb-6 text-xs',
          dark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-50 text-zinc-500'
        )}>
          You are on the <span className="font-semibold">{TIER_LABELS[currentTier]}</span> plan.
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpgrade}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FA4500] px-5 py-3 text-sm font-bold text-white hover:bg-[#e03e00] transition-colors"
          >
            <Zap size={16} />
            Upgrade to Pro — $19/mo
          </button>
          <button
            onClick={handleDismiss}
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-medium transition-colors',
              dark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
            )}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
