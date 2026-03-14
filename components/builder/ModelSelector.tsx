'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Re-export from central registry for backward compatibility
export { MODELS, type AIModel } from '@/lib/models';
import { MODELS } from '@/lib/models';
import type { AIModel } from '@/lib/models';

interface ModelSelectorProps {
  projectId?: string;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
}

export default function ModelSelector({ projectId, selectedModelId, onModelChange, compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = MODELS.find(m => m.id === selectedModelId) ?? MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (model: AIModel) => {
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
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--editor-fg-tertiary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-[320px] rounded-xl border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-sans uppercase tracking-wider text-[var(--editor-fg-tertiary)] border-b border-[var(--editor-border-faint)]">
            Choose AI Model
          </div>
          {MODELS.map((model) => {
            const isSelected = model.id === selected.id;
            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--editor-bg-hover)] ${
                  isSelected ? 'bg-[var(--editor-accent-8)]' : ''
                }`}
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
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--editor-fg-tertiary)] font-sans">{model.tags[0]}</span>
                    <span className="text-[11px] text-[var(--editor-fg-dim)]">·</span>
                    <span className="text-[11px] text-[var(--editor-fg-dim)] font-mono">
                      {model.costPer1k === 0 ? 'Free' : `$${model.costPer1k}/1k tokens`}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[var(--editor-accent)] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
