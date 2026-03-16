'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock } from 'lucide-react';

// Re-export from central registry for backward compatibility
export { MODELS, type AIModel } from '@/lib/models';
import { MODELS, isModelFreeAfterDepletion } from '@/lib/models';
import type { AIModel } from '@/lib/models';
import type { SubscriptionTier } from '@/lib/subscription/gate';

interface ModelSelectorProps {
  projectId?: string;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
  creditsRemaining?: number;
  creditsTotal?: number;
  tier?: SubscriptionTier;
  onUpgrade?: () => void;
}

export default function ModelSelector({
  projectId,
  selectedModelId,
  onModelChange,
  compact = false,
  creditsRemaining,
  creditsTotal,
  tier = 'free',
  onUpgrade,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = MODELS.find(m => m.id === selectedModelId) ?? MODELS[0];
  const hasCredits = creditsRemaining !== undefined ? creditsRemaining > 0 : true;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Check if a model is currently accessible to this user */
  function canUseModel(model: AIModel): boolean {
    if (hasCredits && creditsRemaining !== undefined && creditsRemaining >= model.creditCost) return true;
    if (isModelFreeAfterDepletion(model.id, tier)) return true;
    return hasCredits; // if we don't have credit info, allow (backend enforces)
  }

  /** Get the display label for credit cost */
  function getCreditLabel(model: AIModel): string {
    if (!hasCredits && isModelFreeAfterDepletion(model.id, tier)) return 'FREE';
    if (model.creditCost === 0) return 'Free';
    return `${model.creditCost} cr`;
  }

  const handleSelect = (model: AIModel) => {
    if (!canUseModel(model)) {
      // Can't use this model — trigger upgrade
      if (onUpgrade) {
        onUpgrade();
      }
      setOpen(false);
      return;
    }
    onModelChange(model.id);
    if (projectId) {
      try { localStorage.setItem(`argus_model_${projectId}`, model.id); } catch {}
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] hover:bg-[var(--editor-bg-card)] transition-colors ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: selected.color }}
        />
        <span className="text-white font-sans truncate max-w-[140px]">
          {selected.name}
        </span>
        {creditsRemaining !== undefined && (
          <span className="text-[10px] text-[var(--editor-fg-dim)] font-mono">
            {creditsRemaining} cr
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--editor-fg-tertiary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-[340px] rounded-xl border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header with credit balance */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-[var(--editor-border-faint)]">
            <span className="text-[11px] font-sans uppercase tracking-wider text-[var(--editor-fg-tertiary)]">
              Choose AI Model
            </span>
            {creditsRemaining !== undefined && creditsTotal !== undefined && (
              <span className="text-[11px] font-mono text-[var(--editor-fg-muted)]">
                Credits: {creditsRemaining}/{creditsTotal}
              </span>
            )}
          </div>

          {MODELS.map((model) => {
            const isSelected = model.id === selected.id;
            const accessible = canUseModel(model);
            const creditLabel = getCreditLabel(model);
            const isFreeAfterDepletion = isModelFreeAfterDepletion(model.id, tier);

            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  accessible ? 'hover:bg-[var(--editor-bg-hover)]' : 'opacity-60 hover:bg-[var(--editor-bg-hover)]'
                } ${isSelected ? 'bg-[var(--editor-accent-8)]' : ''}`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: model.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-white">{model.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--editor-bg-hover)] text-[var(--editor-fg-muted)] font-mono">
                      {model.provider}
                    </span>
                    {model.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded text-white font-sans ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--editor-fg-tertiary)] font-sans">{model.tags[0]}</span>
                    <span className="text-[11px] text-[var(--editor-fg-dim)]">·</span>
                    <span className={`text-[11px] font-mono ${
                      isFreeAfterDepletion && !hasCredits
                        ? 'text-emerald-400'
                        : 'text-[var(--editor-fg-dim)]'
                    }`}>
                      {creditLabel}
                    </span>
                  </div>
                </div>
                {!accessible ? (
                  <Lock className="w-3.5 h-3.5 text-[var(--editor-fg-dim)] flex-shrink-0" />
                ) : isSelected ? (
                  <Check className="w-4 h-4 text-[var(--editor-accent)] flex-shrink-0" />
                ) : null}
              </button>
            );
          })}

          {/* Upgrade CTA when user has low/no credits */}
          {creditsRemaining !== undefined && creditsRemaining <= 5 && onUpgrade && (
            <div className="px-3 py-2.5 border-t border-[var(--editor-border-faint)]">
              <button
                onClick={() => { onUpgrade(); setOpen(false); }}
                className="w-full text-center text-xs font-sans py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                {creditsRemaining <= 0 ? 'Upgrade to Pro — Unlock all models' : 'Running low — Upgrade to Pro'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
