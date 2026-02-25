'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tag: string;
  costPer1k: number;
  color: string;
}

export const MODELS: AIModel[] = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', tag: 'Best overall', costPer1k: 0.003, color: '#CC785C' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Best reasoning', costPer1k: 0.005, color: '#10A37F' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', tag: 'Fastest', costPer1k: 0.001, color: '#4285F4' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Groq', tag: 'Free tier', costPer1k: 0, color: '#7C3AED' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Best for logic', costPer1k: 0.002, color: '#0EA5E9' },
];

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
        className={`flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-[#1A1A1A] transition-colors ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: selected.color }}
        />
        <span className="text-white font-mono truncate max-w-[140px]">
          {selected.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#666] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-[320px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-[#666] border-b border-[rgba(255,255,255,0.06)]">
            Choose AI Model
          </div>
          {MODELS.map((model) => {
            const isSelected = model.id === selected.id;
            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#202020] ${
                  isSelected ? 'bg-[rgba(250,69,0,0.08)]' : ''
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: model.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white">{model.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#888] font-mono">
                      {model.provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[#666]">{model.tag}</span>
                    <span className="text-[11px] text-[#555]">·</span>
                    <span className="text-[11px] text-[#555] font-mono">
                      {model.costPer1k === 0 ? 'Free' : `$${model.costPer1k}/1k tokens`}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#FA4500] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
