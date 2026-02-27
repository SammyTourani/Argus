'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, AlertCircle, Loader2, History, Bookmark, Check } from 'lucide-react';
import type { ProjectBuild } from '@/types/database';

interface VersionHistoryPanelProps {
  projectId: string;
  currentBuildId: string;
  onSelectVersion: (buildId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    building: {
      label: 'Building',
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    running: {
      label: 'Running',
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    pending: {
      label: 'Pending',
      color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
      icon: <Clock className="w-2.5 h-2.5" />,
    },
    success: {
      label: 'Complete',
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    },
    complete: {
      label: 'Complete',
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    },
    failed: {
      label: 'Failed',
      color: 'text-red-400 bg-red-400/10 border-red-400/20',
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
  };

  const s = map[status] ?? map['pending'];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider ${s.color}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function SkeletonItem() {
  return (
    <div className="px-4 py-3 border-b border-zinc-800/50 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-8 bg-zinc-700 rounded" />
        <div className="h-4 w-16 bg-zinc-800 rounded" />
      </div>
      <div className="h-3 w-3/4 bg-zinc-800 rounded mb-1" />
      <div className="h-2 w-1/2 bg-zinc-800 rounded" />
    </div>
  );
}

export default function VersionHistoryPanel({
  projectId,
  currentBuildId,
  onSelectVersion,
  isOpen,
  onClose,
}: VersionHistoryPanelProps) {
  const [builds, setBuilds] = useState<ProjectBuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkpointMode, setCheckpointMode] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);
  const [checkpointSaved, setCheckpointSaved] = useState(false);

  const fetchBuilds = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/builds`);
      if (res.ok) {
        const data = await res.json();
        setBuilds(data.builds ?? []);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) fetchBuilds();
  }, [isOpen, fetchBuilds]);

  const handleSaveCheckpoint = async () => {
    if (!checkpointName.trim()) return;
    setSavingCheckpoint(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/builds/${currentBuildId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: checkpointName.trim() }),
        }
      );
      if (res.ok) {
        setCheckpointSaved(true);
        setCheckpointMode(false);
        setCheckpointName('');
        setTimeout(() => setCheckpointSaved(false), 2500);
        fetchBuilds();
      }
    } catch {
      // noop
    } finally {
      setSavingCheckpoint(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, duration: 0.2 }}
            className="fixed right-0 top-0 h-full w-[340px] bg-[#0A0A0A] border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-[#FA4500]" />
                <span className="text-sm font-mono text-white tracking-tight">Version History</span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded"
                aria-label="Close version history"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save Checkpoint */}
            <div className="px-4 py-3 border-b border-zinc-800/50 flex-shrink-0">
              <AnimatePresence mode="wait">
                {checkpointMode ? (
                  <motion.div
                    key="checkpoint-input"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-2"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={checkpointName}
                      onChange={(e) => setCheckpointName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCheckpoint();
                        if (e.key === 'Escape') {
                          setCheckpointMode(false);
                          setCheckpointName('');
                        }
                      }}
                      placeholder="Checkpoint name…"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#FA4500] transition-colors"
                    />
                    <button
                      onClick={handleSaveCheckpoint}
                      disabled={savingCheckpoint || !checkpointName.trim()}
                      className="px-2.5 py-1.5 rounded bg-[#FA4500] hover:bg-[#E63F00] disabled:opacity-50 text-white text-xs font-mono transition-colors flex items-center gap-1"
                    >
                      {savingCheckpoint ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => { setCheckpointMode(false); setCheckpointName(''); }}
                      className="px-2 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-white text-xs font-mono transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="checkpoint-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setCheckpointMode(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 hover:border-[#FA4500]/50 text-zinc-400 hover:text-white text-xs font-mono transition-colors group"
                  >
                    <Bookmark className="w-3 h-3 group-hover:text-[#FA4500] transition-colors" />
                    {checkpointSaved ? (
                      <span className="text-emerald-400">Checkpoint saved!</span>
                    ) : (
                      'Save checkpoint'
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Build list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <>
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                </>
              ) : builds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <History className="w-8 h-8 text-zinc-700" />
                  <p className="text-zinc-500 text-xs font-mono">No builds yet.</p>
                  <p className="text-zinc-600 text-[11px] font-mono">
                    Each time you generate a new version it will appear here.
                  </p>
                </div>
              ) : (
                <ul>
                  {builds.map((build) => {
                    const isCurrent = build.id === currentBuildId;
                    return (
                      <li
                        key={build.id}
                        className={`px-4 py-3 border-b border-zinc-800/50 transition-colors ${
                          isCurrent
                            ? 'bg-[#FA4500]/5 border-l-2 border-l-[#FA4500]'
                            : 'hover:bg-zinc-900/60 border-l-2 border-l-transparent'
                        }`}
                      >
                        {/* Row 1: version + status + time */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[#FA4500] font-mono text-xs font-semibold flex-shrink-0">
                            #{build.version_number}
                          </span>
                          <StatusBadge status={build.status} />
                          {isCurrent && (
                            <span className="ml-auto text-[10px] font-mono text-[#FA4500] bg-[#FA4500]/10 border border-[#FA4500]/20 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                              Current
                            </span>
                          )}
                          {!isCurrent && (
                            <span className="ml-auto text-[10px] font-mono text-zinc-500 flex-shrink-0">
                              {timeAgo(build.created_at)}
                            </span>
                          )}
                        </div>

                        {/* Row 2: model + time (for current) */}
                        <div className="flex items-center gap-2 mb-1.5">
                          {build.model && (
                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/50">
                              {build.model}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                              {timeAgo(build.created_at)}
                            </span>
                          )}
                        </div>

                        {/* Row 3: title preview */}
                        {build.title && (
                          <p className="text-[11px] font-mono text-zinc-400 line-clamp-1 mb-2">
                            {build.title.slice(0, 60)}
                            {build.title.length > 60 ? '…' : ''}
                          </p>
                        )}

                        {/* Action */}
                        {!isCurrent && (
                          <button
                            onClick={() => onSelectVersion(build.id)}
                            className="text-[11px] font-mono text-zinc-400 hover:text-white border border-zinc-700/60 hover:border-zinc-500 px-2.5 py-1 rounded transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
