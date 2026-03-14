'use client';

/**
 * BuildStatusBar — A slim status bar at the bottom of the builder
 * showing real-time build status, token usage, and action shortcuts.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Code2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BuildStatus = 'idle' | 'generating' | 'applying' | 'success' | 'error';

interface BuildStatusBarProps {
  status: BuildStatus;
  message?: string;
  filesChanged?: number;
  tokensUsed?: number;
  duration?: number; // ms
  errorMessage?: string;
}

const STATUS_CONFIG: Record<BuildStatus, { icon: typeof Zap; color: string; label: string }> = {
  idle: { icon: Code2, color: 'var(--editor-fg-dim)', label: 'Ready' },
  generating: { icon: Loader2, color: 'var(--editor-accent)', label: 'Generating' },
  applying: { icon: Loader2, color: 'var(--editor-info)', label: 'Applying' },
  success: { icon: CheckCircle, color: 'var(--editor-success)', label: 'Done' },
  error: { icon: AlertCircle, color: 'var(--editor-error)', label: 'Error' },
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function BuildStatusBar({
  status,
  message,
  filesChanged,
  tokensUsed,
  duration,
  errorMessage,
}: BuildStatusBarProps) {
  const [dots, setDots] = useState('');
  const isLoading = status === 'generating' || status === 'applying';
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Animated dots
  useEffect(() => {
    if (!isLoading) { setDots(''); return; }
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="flex items-center h-7 px-4 border-t border-[var(--editor-border-faint)] bg-[var(--editor-bg-deep)] text-[11px] font-mono flex-shrink-0">
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 mr-4">
        <Icon
          className={cn('w-3 h-3', isLoading && 'animate-spin')}
          style={{ color: config.color }}
        />
        <span className="font-sans" style={{ color: config.color }}>{config.label}</span>
        {isLoading && <span style={{ color: config.color }}>{dots}</span>}
      </div>

      {/* Message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.span
            key={message}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[var(--editor-fg-dim)] font-sans mr-4 truncate max-w-[300px]"
          >
            {message}
          </motion.span>
        )}
      </AnimatePresence>

      {errorMessage && (
        <span className="text-red-400 font-sans truncate max-w-[300px] mr-4">{errorMessage}</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="flex items-center gap-4 text-[var(--editor-fg-ghost)]">
        {filesChanged !== undefined && filesChanged > 0 && (
          <div className="flex items-center gap-1">
            <Code2 className="w-3 h-3" />
            <span>{filesChanged} file{filesChanged !== 1 ? 's' : ''} changed</span>
          </div>
        )}
        {tokensUsed !== undefined && tokensUsed > 0 && (
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{tokensUsed.toLocaleString()} tokens</span>
          </div>
        )}
        {duration !== undefined && duration > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatMs(duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
