'use client'

import { useEffect, useState } from 'react'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

export default function WorkspaceClientShell({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Read dark mode preference from localStorage (set by template switcher)
    const stored = localStorage.getItem('argus-dark-mode')
    if (stored === 'true') {
      setIsDark(true)
    }

    // Listen for dark mode changes from other components
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'argus-dark-mode') {
        setIsDark(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorage)

    // Also listen for custom event (same-tab changes)
    const handleDarkModeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setIsDark(detail?.dark ?? false)
    }
    window.addEventListener('argus-dark-mode-change', handleDarkModeChange)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('argus-dark-mode-change', handleDarkModeChange)
    }
  }, [])

  return (
    <div className={`workspace-root${isDark ? ' dark' : ''}`}>
      <ErrorBoundary fallbackMessage="The workspace encountered an error. Your data is safe.">
        {children}
      </ErrorBoundary>
    </div>
  )
}
