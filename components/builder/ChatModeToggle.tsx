'use client';

import { Code2, MessageCircle } from 'lucide-react';
import type { ChatMode } from '@/lib/ai/chat-modes';
import { CHAT_MODES } from '@/lib/ai/chat-modes';

interface ChatModeToggleProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const ICONS: Record<ChatMode, typeof Code2> = {
  build: Code2,
  discuss: MessageCircle,
};

export default function ChatModeToggle({ mode, onChange, disabled }: ChatModeToggleProps) {
  return (
    <div className="flex items-center bg-[var(--editor-bg-surface)] rounded-md p-0.5 flex-shrink-0">
      {(Object.keys(CHAT_MODES) as ChatMode[]).map((modeKey) => {
        const config = CHAT_MODES[modeKey];
        const Icon = ICONS[modeKey];
        const isActive = mode === modeKey;

        return (
          <button
            key={modeKey}
            onClick={() => onChange(modeKey)}
            disabled={disabled}
            title={config.description}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
              isActive
                ? 'bg-[var(--editor-accent)] text-white'
                : 'bg-transparent text-[var(--editor-fg-tertiary)] hover:text-[var(--editor-fg-muted)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
