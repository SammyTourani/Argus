'use client';

import type { PromptVariant } from '@/lib/ai/prompt-library';
import { PROMPT_TEMPLATES } from '@/lib/ai/prompt-library';

interface PromptVariantSelectorProps {
  selected: PromptVariant;
  onChange: (variant: PromptVariant) => void;
}

const VARIANT_ORDER: PromptVariant[] = ['default', 'concise', 'design-focused'];

export default function PromptVariantSelector({ selected, onChange }: PromptVariantSelectorProps) {
  return (
    <div className="flex items-stretch gap-2">
      {VARIANT_ORDER.map((variant) => {
        const template = PROMPT_TEMPLATES[variant];
        const isActive = selected === variant;

        return (
          <button
            key={variant}
            onClick={() => onChange(variant)}
            className={`flex flex-col items-start px-3 py-2 rounded-md border text-left transition-colors ${
              isActive
                ? 'border-[#FA4500] bg-[rgba(250,69,0,0.08)]'
                : 'border-transparent hover:border-[rgba(255,255,255,0.1)]'
            }`}
          >
            <span
              className={`text-[12px] font-mono font-medium leading-tight ${
                isActive ? 'text-[#FA4500]' : 'text-[#999]'
              }`}
            >
              {template.name}
            </span>
            <span className="text-[10px] text-[#555] leading-tight mt-0.5">
              {template.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
