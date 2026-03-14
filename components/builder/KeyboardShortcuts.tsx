'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['⌘', '/'], desc: 'Toggle shortcuts' },
    { keys: ['⌘', 'K'], desc: 'Focus chat input' },
    { keys: ['Esc'], desc: 'Close panel / editor' },
  ]},
  { category: 'Panels', items: [
    { keys: ['⌘', '⇧', 'E'], desc: 'Toggle code panel' },
    { keys: ['⌘', '⇧', 'V'], desc: 'Toggle visual editor' },
  ]},
  { category: 'Building', items: [
    { keys: ['⌘', '↵'], desc: 'Send message / generate' },
  ]},
];

function Key({ k }: { k: string }) {
  return (
    <kbd className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded bg-[var(--editor-bg-hover)] border border-[var(--editor-border-hover)] text-[10px] font-mono text-[var(--editor-fg-tertiary)]">
      {k}
    </kbd>
  );
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-[var(--editor-bg-base)] border border-[var(--editor-border-hover)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--editor-border-faint)]">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[var(--editor-accent)]" />
                <h2 className="text-sm font-sans font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="text-[var(--editor-fg-tertiary)] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {SHORTCUTS.map(section => (
                <div key={section.category}>
                  <p className="text-[10px] font-sans text-[var(--editor-accent)] uppercase tracking-widest mb-3">{section.category}</p>
                  <div className="space-y-2.5">
                    {section.items.map(item => (
                      <div key={item.desc} className="flex items-center justify-between">
                        <span className="text-[13px] font-sans text-[var(--editor-fg-muted)]">{item.desc}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, i) => <Key key={i} k={k} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
