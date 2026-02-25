'use client';

import Link from 'next/link';
import { ArrowLeft, Share2, Rocket } from 'lucide-react';
import { useState, useCallback } from 'react';
import ModelSelector from './ModelSelector';

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
}: BuilderNavProps) {
  const [showShareToast, setShowShareToast] = useState(false);

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
    <nav className="h-12 bg-[#0A0A0A] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 flex-shrink-0 relative z-10">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 text-[#666] hover:text-white transition-colors text-sm font-mono flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </Link>
        <span className="text-[#333] font-mono">/</span>
        <span className="text-white text-sm font-mono truncate max-w-[160px]">
          {projectName}
        </span>

        {/* Panel toggles */}
        <div className="flex items-center gap-1 ml-3 border-l border-[rgba(255,255,255,0.06)] pl-3">
          <button
            onClick={onToggleLeft}
            className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
              leftPanelVisible
                ? 'bg-[#2A2A2A] text-white'
                : 'text-[#555] hover:text-white'
            }`}
            title="Toggle chat panel"
          >
            Chat
          </button>
          <button
            onClick={onToggleRight}
            className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
              rightPanelVisible
                ? 'bg-[#2A2A2A] text-white'
                : 'text-[#555] hover:text-white'
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
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {extraActions}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#888] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        {publishSlot ?? (
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white bg-[#FA4500] hover:bg-[#E63F00] disabled:opacity-50 transition-colors"
          >
            <Rocket className="w-3.5 h-3.5" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        )}

        {/* User avatar placeholder */}
        <div className="w-7 h-7 rounded-full bg-[#2A2A2A] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[11px] font-mono text-[#888]">
          S
        </div>
      </div>

      {/* Share toast */}
      {showShareToast && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#2A2A2A] text-white text-xs font-mono px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
          Link copied!
        </div>
      )}
    </nav>
  );
}
