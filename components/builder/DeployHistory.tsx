'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  X,
  Rocket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface Deployment {
  id: string;
  buildId: string;
  version: number;
  url: string;
  status: string;
  createdAt: string;
  duration: number | null;
}

interface DeployHistoryProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onRollback?: (buildId: string) => void;
}

/* ─── Helpers ─── */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'deployed' || normalized === 'ready' || normalized === 'live') {
    return {
      label: 'Live',
      color: 'text-green-400 bg-green-400/10 border-green-900/30',
      icon: CheckCircle,
    };
  }
  if (normalized === 'building' || normalized === 'deploying' || normalized === 'initializing') {
    return {
      label: 'Building',
      color: 'text-[#FA4500] bg-[#FA4500]/10 border-[#FA4500]/30',
      icon: Loader2,
    };
  }
  if (normalized === 'failed' || normalized === 'error') {
    return {
      label: 'Failed',
      color: 'text-red-400 bg-red-400/10 border-red-900/30',
      icon: XCircle,
    };
  }
  return {
    label: status,
    color: 'text-[#888] bg-[#888]/10 border-[rgba(255,255,255,0.08)]',
    icon: Clock,
  };
}

/* ─── Loading Skeleton ─── */
function DeployHistorySkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-[#0E0E0E] animate-pulse"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1A1A1A]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 rounded bg-[#1A1A1A]" />
            <div className="h-2.5 w-32 rounded bg-[#1A1A1A]" />
          </div>
          <div className="h-5 w-12 rounded-full bg-[#1A1A1A]" />
        </div>
      ))}
    </div>
  );
}

/* ─── Empty State ─── */
function DeployHistoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
        <Rocket className="w-5 h-5 text-[#555]" />
      </div>
      <div className="text-center">
        <p className="text-xs font-mono text-[#888]">No deployments yet</p>
        <p className="text-[11px] font-mono text-[#555] mt-1">
          Deploy your project to see history here
        </p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function DeployHistory({
  projectId,
  isOpen,
  onClose,
  onRollback,
}: DeployHistoryProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/deploy/history?projectId=${encodeURIComponent(projectId)}&limit=10`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch history (${res.status})`);
      }

      const data = await res.json();
      setDeployments(data.deployments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handleRollback = useCallback(
    async (buildId: string) => {
      if (rollingBack) return;
      setRollingBack(buildId);

      try {
        const res = await fetch('/api/deploy/rollback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, buildId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? `Rollback failed (${res.status})`);
        }

        // Notify parent and refresh history
        onRollback?.(buildId);
        await fetchHistory();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rollback failed');
      } finally {
        setRollingBack(null);
      }
    },
    [projectId, rollingBack, onRollback, fetchHistory]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-[#0A0A0A] border-l border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#FA4500]" />
                <h2 className="text-sm font-mono font-semibold text-white">
                  Deploy History
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <DeployHistorySkeleton />
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <p className="text-xs font-mono text-red-300 text-center max-w-[200px]">
                    {error}
                  </p>
                  <button
                    onClick={fetchHistory}
                    className="text-[11px] font-mono text-[#FA4500] hover:text-[#E63F00] transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : deployments.length === 0 ? (
                <DeployHistoryEmpty />
              ) : (
                <div className="flex flex-col gap-2">
                  {deployments.map((deploy, index) => {
                    const badge = statusBadge(deploy.status);
                    const BadgeIcon = badge.icon;
                    const isFirst = index === 0;
                    const isRollingBack = rollingBack === deploy.buildId;

                    return (
                      <motion.div
                        key={deploy.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={cn(
                          'group relative rounded-xl border p-3 transition-colors',
                          isFirst
                            ? 'bg-[#0E0E0E] border-[#FA4500]/20'
                            : 'bg-[#0E0E0E] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Version number */}
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold',
                              isFirst
                                ? 'bg-[#FA4500]/10 text-[#FA4500]'
                                : 'bg-[#1A1A1A] text-[#888]'
                            )}
                          >
                            v{deploy.version}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {/* Status badge */}
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono border',
                                  badge.color
                                )}
                              >
                                <BadgeIcon
                                  className={cn(
                                    'w-2.5 h-2.5',
                                    badge.label === 'Building' && 'animate-spin'
                                  )}
                                />
                                {badge.label}
                              </span>

                              {isFirst && (
                                <span className="text-[10px] font-mono text-[#FA4500]">
                                  latest
                                </span>
                              )}
                            </div>

                            {/* URL */}
                            {deploy.url && (
                              <a
                                href={deploy.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 mt-1 text-[11px] font-mono text-[#666] hover:text-white transition-colors truncate max-w-[200px]"
                                title={deploy.url}
                              >
                                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">
                                  {deploy.url.replace('https://', '')}
                                </span>
                              </a>
                            )}

                            {/* Time */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Clock className="w-2.5 h-2.5 text-[#555]" />
                              <span className="text-[10px] font-mono text-[#555]">
                                {relativeTime(deploy.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Rollback button (hidden on first / latest) */}
                          {!isFirst && (
                            <button
                              onClick={() => handleRollback(deploy.buildId)}
                              disabled={isRollingBack || !!rollingBack}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-all',
                                'opacity-0 group-hover:opacity-100',
                                isRollingBack
                                  ? 'text-[#FA4500] bg-[#FA4500]/10 cursor-wait'
                                  : 'text-[#888] hover:text-white hover:bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)]'
                              )}
                              title="Rollback to this version"
                            >
                              {isRollingBack ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              {isRollingBack ? 'Rolling back...' : 'Rollback'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
