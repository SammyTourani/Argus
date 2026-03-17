'use client';

import '@/styles/workspace-v2.css';
import { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('argus-dark-mode');
    if (stored === 'true') setIsDark(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'argus-dark-mode') setIsDark(e.newValue === 'true');
    };
    window.addEventListener('storage', handleStorage);

    const handleDarkModeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsDark(detail?.dark ?? false);
    };
    window.addEventListener('argus-dark-mode-change', handleDarkModeChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('argus-dark-mode-change', handleDarkModeChange);
    };
  }, []);

  return (
    <div className={`workspace-root${isDark ? ' dark' : ''}`}>
      <ErrorBoundary fallbackMessage="Settings encountered an error.">
        {children}
      </ErrorBoundary>
    </div>
  );
}
