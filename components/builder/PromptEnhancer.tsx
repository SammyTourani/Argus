'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';

interface PromptEnhancerProps {
  prompt: string;
  onAccept: (enhancedPrompt: string) => void;
  onDismiss: () => void;
  projectContext?: string;
  disabled?: boolean;
}

interface EnhanceResult {
  enhanced: string;
  changes: string[];
}

export default function PromptEnhancer({
  prompt,
  onAccept,
  onDismiss,
  projectContext,
  disabled,
}: PromptEnhancerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        handleDismiss();
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  const handleEnhance = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowPopover(true);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ...(projectContext ? { projectContext } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data: EnhanceResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to enhance prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result.enhanced);
    }
    setShowPopover(false);
    setResult(null);
  };

  const handleDismiss = () => {
    setShowPopover(false);
    setResult(null);
    setError(null);
    onDismiss();
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Sparkle button */}
      <button
        ref={buttonRef}
        onClick={handleEnhance}
        disabled={disabled || !prompt.trim() || isLoading}
        title="Enhance prompt with AI"
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
          isLoading
            ? 'bg-[var(--editor-accent-20)] text-[var(--editor-accent)] cursor-wait'
            : 'bg-transparent text-[var(--editor-fg-dim)] hover:text-[var(--editor-accent)] hover:bg-[var(--editor-accent-10)]'
        } ${disabled || !prompt.trim() ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[360px] max-h-[400px] overflow-y-auto bg-[var(--editor-bg-card)] border border-[var(--editor-border)] rounded-xl shadow-2xl shadow-black/50 z-50"
        >
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[var(--editor-accent)]" />
              <span className="text-xs font-sans text-[var(--editor-fg-muted)] font-medium">
                Prompt Enhancer
              </span>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 className="w-4 h-4 text-[var(--editor-accent)] animate-spin" />
                <span className="text-xs font-sans text-[var(--editor-fg-tertiary)]">
                  Enhancing your prompt...
                </span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="py-2">
                <p className="text-xs font-sans text-red-400 mb-3">{error}</p>
                <button
                  onClick={handleDismiss}
                  className="w-full px-3 py-1.5 rounded-md bg-[var(--editor-bg-surface)] text-[var(--editor-fg-muted)] text-xs font-sans hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Result state */}
            {result && (
              <>
                {/* Enhanced prompt */}
                <div className="mb-3">
                  <p className="text-[10px] font-sans text-[var(--editor-fg-dim)] uppercase tracking-wide mb-1.5">
                    Enhanced Prompt
                  </p>
                  <div className="bg-[var(--editor-bg-surface)] rounded-lg p-2.5 text-sm text-white font-sans leading-relaxed border border-[var(--editor-border-faint)]">
                    {result.enhanced}
                  </div>
                </div>

                {/* Changes list */}
                {result.changes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-sans text-[var(--editor-fg-dim)] uppercase tracking-wide mb-1.5">
                      Changes Made
                    </p>
                    <ul className="space-y-1">
                      {result.changes.map((change, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs font-sans text-[var(--editor-fg-muted)]"
                        >
                          <span className="text-[var(--editor-accent)] mt-0.5 flex-shrink-0">
                            +
                          </span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--editor-accent)] hover:bg-[var(--editor-accent-hover)] text-white text-xs font-sans font-medium transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Use Enhanced
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--editor-bg-surface)] hover:bg-[var(--editor-bg-hover)] text-[var(--editor-fg-muted)] hover:text-white text-xs font-sans transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Keep Original
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
