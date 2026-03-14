'use client';

import { useState, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, Monitor, Smartphone, Share2, Loader2 } from 'lucide-react';

interface PreviewPanelProps {
  sandboxUrl?: string;
  isLoading?: boolean;
  isGenerating?: boolean;
  error?: string | null;
  onRetry?: () => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export default function PreviewPanel({
  sandboxUrl,
  isLoading = false,
  isGenerating = false,
  error = null,
  onRetry,
  iframeRef: externalIframeRef,
}: PreviewPanelProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showToast, setShowToast] = useState(false);
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef ?? internalIframeRef;

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleOpenNewTab = useCallback(() => {
    if (sandboxUrl) window.open(sandboxUrl, '_blank');
  }, [sandboxUrl]);

  const handleSharePreview = useCallback(async () => {
    if (!sandboxUrl) return;
    try {
      await navigator.clipboard.writeText(sandboxUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // Fallback: select + copy
    }
  }, [sandboxUrl]);

  const showLoadingOverlay = isLoading || isGenerating;

  return (
    <div className="flex flex-col h-full bg-[var(--editor-bg-surface)] relative">
      {/* Top bar */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-[var(--editor-border-faint)] bg-[var(--editor-bg-base)] flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md overflow-hidden border border-[var(--editor-border)]">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 transition-colors ${
                viewMode === 'desktop' ? 'bg-[var(--editor-bg-hover)] text-white' : 'text-[var(--editor-fg-tertiary)] hover:text-white'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 transition-colors ${
                viewMode === 'mobile' ? 'bg-[var(--editor-bg-hover)] text-white' : 'text-[var(--editor-fg-tertiary)] hover:text-white'
              }`}
              title="Mobile view (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* URL display */}
          <div className="text-xs font-mono text-[var(--editor-fg-dim)] truncate max-w-[280px] bg-[var(--editor-bg-elevated)] px-2 py-1 rounded border border-[var(--editor-border-faint)]">
            {sandboxUrl ? new URL(sandboxUrl).hostname : 'No preview available'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-[var(--editor-fg-tertiary)] hover:text-white transition-colors rounded hover:bg-[var(--editor-bg-hover)]"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenNewTab}
            disabled={!sandboxUrl}
            className="p-1.5 text-[var(--editor-fg-tertiary)] hover:text-white transition-colors rounded hover:bg-[var(--editor-bg-hover)] disabled:opacity-30"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSharePreview}
            disabled={!sandboxUrl}
            className="p-1.5 text-[var(--editor-fg-tertiary)] hover:text-white transition-colors rounded hover:bg-[var(--editor-bg-hover)] disabled:opacity-30"
            title="Copy preview URL"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center p-6 border-2 border-red-500/30 rounded-xl bg-red-500/5 max-w-sm">
            <p className="text-red-400 text-sm font-sans">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-[var(--editor-accent)] text-white text-sm font-sans hover:bg-[var(--editor-accent-hover)] transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : sandboxUrl ? (
          <div
            className={`h-full transition-all duration-300 ${
              viewMode === 'mobile' ? 'w-[375px] border-x border-[var(--editor-border)] mx-auto' : 'w-full'
            }`}
          >
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={sandboxUrl}
              className="w-full h-full border-none bg-white"
              title="App Preview"
              allow="clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ) : (
          <div className="text-[var(--editor-fg-ghost)] text-sm font-sans text-center">
            <p>Start a conversation to see your app here</p>
          </div>
        )}

        {/* Loading overlay */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 bg-[var(--editor-bg-base)]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[var(--editor-accent)] animate-spin mb-3" />
            <p className="text-white text-sm font-sans">
              Building your app
              <span className="inline-flex w-6 text-left">
                <span className="animate-pulse">...</span>
              </span>
            </p>
            <p className="text-[var(--editor-fg-tertiary)] text-xs font-sans mt-1">
              {isGenerating ? 'Generating code' : 'Setting up sandbox'}
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--editor-bg-hover)] text-white text-xs font-sans px-3 py-2 rounded-lg border border-[var(--editor-border-hover)] shadow-lg z-20 animate-in fade-in slide-in-from-bottom-2">
          Copied preview URL!
        </div>
      )}
    </div>
  );
}
