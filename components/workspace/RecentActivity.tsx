'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, FolderPlus, Hammer, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RecentActivityItem } from '@/app/api/workspace/stats/route';

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function ActivityIcon({ type }: { type: RecentActivityItem['type'] }) {
  const config = {
    created: { icon: FolderPlus, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    built: { icon: Hammer, bg: 'bg-blue-50', color: 'text-blue-600' },
    deployed: { icon: Rocket, bg: 'bg-[#FA4500]/10', color: 'text-[#FA4500]' },
  };

  const { icon: Icon, bg, color } = config[type];

  return (
    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', bg)}>
      <Icon className={cn('h-3.5 w-3.5', color)} />
    </div>
  );
}

function ActivityDescription({ item }: { item: RecentActivityItem }) {
  switch (item.type) {
    case 'created':
      return (
        <span>
          Created project <span className="font-semibold text-zinc-900">{item.projectName}</span>
        </span>
      );
    case 'built':
      return (
        <span>
          Built{' '}
          {item.meta?.versionNumber != null && (
            <>version <span className="font-semibold text-zinc-900">v{item.meta.versionNumber}</span> of </>
          )}
          <span className="font-semibold text-zinc-900">{item.projectName}</span>
          {item.meta?.modelId && (
            <span className="ml-1 text-zinc-400">
              with {item.meta.modelId}
            </span>
          )}
        </span>
      );
    case 'deployed':
      return (
        <span>
          Deployed <span className="font-semibold text-zinc-900">{item.projectName}</span>
          {item.meta?.previewUrl && (
            <a
              href={item.meta.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-1 text-[#FA4500] hover:underline"
            >
              View
            </a>
          )}
        </span>
      );
    default:
      return null;
  }
}

interface RecentActivityProps {
  activities?: RecentActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<RecentActivityItem[]>(activities ?? []);
  const [loading, setLoading] = useState(!activities);

  // Fetch from API if not provided via props
  useEffect(() => {
    if (activities) {
      setItems(activities);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchActivity() {
      try {
        const res = await fetch('/api/workspace/stats');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) {
          setItems(data.recentActivity ?? []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    fetchActivity();
    return () => { cancelled = true; };
  }, [activities]);

  // Don't render if no activity and not loading
  if (!loading && items.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      {/* Header - always visible, click to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50"
      >
        <h3 className="text-[13px] font-semibold text-zinc-700">
          Recent Activity
          {!loading && items.length > 0 && (
            <span className="ml-1.5 text-zinc-400">({items.length})</span>
          )}
        </h3>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-400 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100 px-4 py-2">
              {loading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-100" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                        <div className="h-2.5 w-1/4 animate-pulse rounded bg-zinc-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[13px] top-3 bottom-3 w-px bg-zinc-100" />

                  <div className="space-y-0.5">
                    {items.map((item, i) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onClick={() => router.push(`/workspace/${item.projectId}`)}
                        className="group relative flex w-full items-center gap-3 rounded-lg py-2 px-1 text-left transition-colors hover:bg-zinc-50"
                      >
                        <ActivityIcon type={item.type} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-zinc-600">
                            <ActivityDescription item={item} />
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {timeAgo(item.timestamp)}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
