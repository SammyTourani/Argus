'use client';

import { useState, useEffect } from 'react';
import { Paintbrush } from 'lucide-react';

const THEMES = ['classic', 'matrix'] as const;
type Theme = typeof THEMES[number];

export default function EditorThemeToggle() {
  const [theme, setTheme] = useState<Theme>('classic');

  useEffect(() => {
    const stored = localStorage.getItem('argus-hero-template');
    if (stored === 'matrix') setTheme('matrix');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'classic' ? 'matrix' : 'classic';
    setTheme(next);
    localStorage.setItem('argus-hero-template', next);

    if (next === 'matrix') {
      document.documentElement.setAttribute('data-argus-dark', 'true');
      document.querySelector('.workspace-root')?.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-argus-dark');
      document.querySelector('.workspace-root')?.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors bg-[var(--editor-bg-elevated)] border border-[var(--editor-border)] text-[var(--editor-fg-secondary)] hover:bg-[var(--editor-bg-hover)] hover:text-[var(--editor-fg-primary)]"
      title={`Theme: ${theme === 'classic' ? 'Classic' : 'Matrix'}`}
    >
      <Paintbrush className="w-4 h-4" />
    </button>
  );
}
