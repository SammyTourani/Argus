'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['⌘', 'K'], desc: 'Open project search' },
    { keys: ['⌘', '/'], desc: 'Toggle shortcuts' },
    { keys: ['⌘', '\\'], desc: 'Toggle code panel' },
    { keys: ['⌘', 'B'], desc: 'Toggle chat panel' },
  ]},
  { category: 'Building', items: [
    { keys: ['⌘', '↵'], desc: 'Send message / generate' },
    { keys: ['⌘', 'R'], desc: 'Refresh preview' },
    { keys: ['⌘', 'P'], desc: 'Publish / deploy' },
    { keys: ['⌘', 'E'], desc: 'Toggle visual editor' },
  ]},
  { category: 'Code', items: [
    { keys: ['⌘', 'D'], desc: 'Download as ZIP' },
    { keys: ['⌘', 'G'], desc: 'Push to GitHub' },
    { keys: ['⌘', 'H'], desc: 'Open version history' },
  ]},
  { category: 'View', items: [
    { keys: ['⌘', 'M'], desc: 'Toggle mobile preview' },
    { keys: ['⌘', 'F'], desc: 'Fullscreen preview' },
    { keys: ['Esc'], desc: 'Exit visual editor' },
  ]},
];

function Key({ k }: { k: string }) {
  return (
    <kbd className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded bg-[#222] border border-[rgba(255,255,255,0.1)] text-[10px] font-mono text-[#aaa]">
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#FA4500]" />
                <h2 className="text-sm font-mono font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {SHORTCUTS.map(section => (
                <div key={section.category}>
                  <p className="text-[10px] font-mono text-[#FA4500] uppercase tracking-widest mb-3">{section.category}</p>
                  <div className="space-y-2.5">
                    {section.items.map(item => (
                      <div key={item.desc} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#888]">{item.desc}</span>
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
