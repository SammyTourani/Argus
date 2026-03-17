'use client';

import { useState, useCallback } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
}

export function useComingSoon() {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  const showComingSoon = useCallback((feature: string) => {
    setToast({ visible: true, message: `${feature} is coming soon` });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }, []);

  return { toast, showComingSoon };
}

export function ComingSoonToast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-2 rounded-lg bg-[var(--editor-bg-card)] border border-[var(--editor-border)] text-[var(--editor-fg-secondary)] text-sm font-sans shadow-lg backdrop-blur-sm">
        {message}
      </div>
    </div>
  );
}
