'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, X, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserError } from '@/lib/errors/user-messages';

// ---------------------------------------------------------------------------
// Toast Item
// ---------------------------------------------------------------------------

interface ToastItemProps {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
  onRetry?: (id: string) => void;
  variant?: 'dark' | 'light';
}

function ToastItem({ toast, onDismiss, onRetry, variant = 'dark' }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [onDismiss, toast.id]);

  // Auto-dismiss retryable toasts after 8 seconds
  useEffect(() => {
    if (toast.error.retryable) {
      const timer = setTimeout(handleDismiss, 8000);
      return () => clearTimeout(timer);
    }
  }, [toast.error.retryable, handleDismiss]);

  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm',
        'transition-all duration-200 ease-out',
        isExiting
          ? 'translate-x-[120%] opacity-0'
          : 'translate-x-0 opacity-100 animate-slide-in-right',
        isDark
          ? 'bg-[#141414]/95 border-white/10 text-white'
          : 'bg-white/95 border-zinc-200 text-zinc-900'
      )}
      style={{ maxWidth: 400 }}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 mt-0.5 rounded-lg p-1.5',
          toast.error.retryable
            ? isDark
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-amber-50 text-amber-600'
            : isDark
              ? 'bg-red-500/10 text-red-400'
              : 'bg-red-50 text-red-600'
        )}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            isDark ? 'text-white' : 'text-zinc-900'
          )}
        >
          {toast.error.title}
        </p>
        <p
          className={cn(
            'mt-1 text-xs leading-relaxed',
            isDark ? 'text-white/60' : 'text-zinc-500'
          )}
        >
          {toast.error.message}
        </p>

        {/* Action buttons */}
        <div className="mt-2.5 flex items-center gap-2">
          {toast.error.retryable && onRetry && (
            <button
              onClick={() => onRetry(toast.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              )}
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
          {toast.error.action && toast.error.actionUrl && (
            <a
              href={toast.error.actionUrl}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                'bg-[#FA4500] text-white hover:bg-[#E63F00]'
              )}
            >
              {toast.error.action}
              <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className={cn(
          'flex-shrink-0 rounded-md p-1 transition-colors',
          isDark
            ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast Container + State Manager
// ---------------------------------------------------------------------------

export interface ToastEntry {
  id: string;
  error: UserError;
  timestamp: number;
}

let toastIdCounter = 0;

/** Global toast state — components subscribe via useErrorToasts() */
type ToastListener = (toasts: ToastEntry[]) => void;

const listeners = new Set<ToastListener>();
let toastQueue: ToastEntry[] = [];

function notifyListeners() {
  listeners.forEach((fn) => fn([...toastQueue]));
}

/**
 * Push an error toast from anywhere in the app.
 * Works from both React components and plain functions.
 */
export function showErrorToast(error: UserError): string {
  const id = `toast-${++toastIdCounter}-${Date.now()}`;
  const entry: ToastEntry = { id, error, timestamp: Date.now() };
  toastQueue = [...toastQueue, entry].slice(-5); // max 5 toasts visible
  notifyListeners();
  return id;
}

/** Dismiss a specific toast by ID */
export function dismissToast(id: string): void {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notifyListeners();
}

/** Dismiss all toasts */
export function clearAllToasts(): void {
  toastQueue = [];
  notifyListeners();
}

// ---------------------------------------------------------------------------
// React Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to the global toast queue. Returns the current list of toasts.
 */
export function useErrorToasts(): ToastEntry[] {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    const listener: ToastListener = (updated) => setToasts(updated);
    listeners.add(listener);
    // Sync current state on mount
    setToasts([...toastQueue]);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return toasts;
}

// ---------------------------------------------------------------------------
// Toast Container Component
// ---------------------------------------------------------------------------

interface ErrorToastContainerProps {
  /** "dark" for the builder, "light" for workspace */
  variant?: 'dark' | 'light';
  /** Called when the user clicks Retry on a retryable toast */
  onRetry?: (toastId: string) => void;
}

/**
 * Render this once at the layout level. It subscribes to the global toast
 * queue and renders stacked toasts in the bottom-right corner.
 */
export default function ErrorToastContainer({
  variant = 'dark',
  onRetry,
}: ErrorToastContainerProps) {
  const toasts = useErrorToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            toast={toast}
            variant={variant}
            onDismiss={dismissToast}
            onRetry={onRetry}
          />
        </div>
      ))}
    </div>
  );
}
