'use client';

import Link from 'next/link';
import { ArrowLeft, Share2, Rocket } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import ModelSelector from './ModelSelector';
import { createClient } from '@/lib/supabase/client';
import type { SubscriptionTier } from '@/lib/subscription/gate';

interface BuilderNavProps {
  projectName?: string;
  projectId: string;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  /** Toggle left panel */
  leftPanelVisible: boolean;
  onToggleLeft: () => void;
  /** Toggle right panel */
  rightPanelVisible: boolean;
  onToggleRight: () => void;
  /** Extra action buttons rendered before Share (e.g. VisualEditor toggle) */
  extraActions?: React.ReactNode;
  /** Replaces the default Publish button — pass a <PublishButton /> here */
  publishSlot?: React.ReactNode;
  /** Credit system props */
  creditsRemaining?: number;
  creditsTotal?: number;
  tier?: SubscriptionTier;
  onUpgrade?: () => void;
}

export default function BuilderNav({
  projectName = 'Untitled Project',
  projectId,
  selectedModelId,
  onModelChange,
  onPublish,
  isPublishing = false,
  leftPanelVisible,
  onToggleLeft,
  rightPanelVisible,
  onToggleRight,
  extraActions,
  publishSlot,
  creditsRemaining,
  creditsTotal,
  tier,
  onUpgrade,
}: BuilderNavProps) {
  const [showShareToast, setShowShareToast] = useState(false);
  const [userInitial, setUserInitial] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.full_name || user.email || '';
      setUserInitial(name.charAt(0).toUpperCase());
    });
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  return (
    <nav className="h-12 bg-[var(--editor-bg-base)] border-b border-[var(--editor-border-faint)] flex items-center justify-between px-4 flex-shrink-0 relative z-10">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 text-[var(--editor-fg-tertiary)] hover:text-white transition-colors text-sm font-sans flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </Link>
        <span className="text-[var(--editor-fg-ghost)] font-mono">/</span>
        <span className="text-white text-sm font-sans truncate max-w-[160px]">
          {projectName}
        </span>

        {/* Panel toggles */}
        <div className="flex items-center gap-1 ml-3 border-l border-[var(--editor-border-faint)] pl-3">
          <button
            onClick={onToggleLeft}
            className={`px-2 py-1 rounded text-[10px] font-sans uppercase tracking-wider transition-colors ${
              leftPanelVisible
                ? 'bg-[var(--editor-bg-hover)] text-white'
                : 'text-[var(--editor-fg-dim)] hover:text-white'
            }`}
            title="Toggle chat panel"
          >
            Chat
          </button>
          <button
            onClick={onToggleRight}
            className={`px-2 py-1 rounded text-[10px] font-sans uppercase tracking-wider transition-colors ${
              rightPanelVisible
                ? 'bg-[var(--editor-bg-hover)] text-white'
                : 'text-[var(--editor-fg-dim)] hover:text-white'
            }`}
            title="Toggle code panel"
          >
            Code
          </button>
        </div>
      </div>

      {/* Center: Model selector */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <ModelSelector
          projectId={projectId}
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
          compact
          creditsRemaining={creditsRemaining}
          creditsTotal={creditsTotal}
          tier={tier}
          onUpgrade={onUpgrade}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {extraActions}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-[var(--editor-fg-muted)] hover:text-white border border-[var(--editor-border)] hover:border-[var(--editor-border-hover)] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        {publishSlot ?? (
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-white bg-[var(--editor-accent)] hover:bg-[var(--editor-accent-hover)] disabled:opacity-50 transition-colors"
          >
            <Rocket className="w-3.5 h-3.5" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        )}

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-[var(--editor-bg-hover)] border border-[var(--editor-border)] flex items-center justify-center text-[11px] font-sans text-[var(--editor-fg-muted)]">
          {userInitial || '?'}
        </div>
      </div>

      {/* Share toast */}
      {showShareToast && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--editor-bg-hover)] text-white text-xs font-sans px-3 py-2 rounded-lg border border-[var(--editor-border-hover)] shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
          Link copied!
        </div>
      )}
    </nav>
  );
}
