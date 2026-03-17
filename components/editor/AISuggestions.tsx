'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface AISuggestionsProps {
  visible: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  'Add dark mode support',
  'Improve mobile responsiveness',
  'Add page navigation',
];

export default function AISuggestions({ visible, onSuggestionClick }: AISuggestionsProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Lightbulb className="w-3 h-3 text-[var(--editor-accent)]" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--editor-fg-muted)]">Suggestions</span>
        <button onClick={() => setDismissed(true)} className="ml-auto text-[var(--editor-fg-dim)] hover:text-[var(--editor-fg-muted)] transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="px-2.5 py-1 text-xs font-sans rounded-lg border border-[var(--editor-border)] text-[var(--editor-fg-tertiary)] hover:text-[var(--editor-fg-primary)] hover:border-[var(--editor-accent)] hover:bg-[var(--editor-accent-8)] transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
