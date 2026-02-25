'use client';

/**
 * ActivityFeed — Shows recent project activity in the sidebar/project detail page.
 * Displays build history and collaborator actions in a timeline format.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, User, GitBranch, Globe, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'build' | 'deploy' | 'collaborate' | 'checkpoint';
  title: string;
  subtitle?: string;
  timestamp: string;
  actor?: string;
  status?: 'success' | 'error' | 'pending';
  buildId?: string;
}

interface ActivityFeedProps {
  projectId: string;
  maxItems?: number;
  compact?: boolean;
}

const TYPE_ICON = {
  build: Zap,
  deploy: Globe,
  collaborate: User,
  checkpoint: GitBranch,
};

const TYPE_COLOR = {
  build: '#FA4500',
  deploy: '#22C55E',
  collaborate: '#3B82F6',
  checkpoint: '#A855F7',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ActivityFeed({ projectId, maxItems = 10, compact = false }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadActivity() {
      setLoading(true);
      try {
        // Fetch builds as activity
        const { data: builds } = await supabase
          .from('project_builds')
          .select('id, version_number, status, prompt, created_at, preview_url, checkpoint_name')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(maxItems);

        const activity: ActivityItem[] = (builds ?? []).map(b => {
          const isCheckpoint = !!b.checkpoint_name;
          const isDeployed = !!b.preview_url;
          return {
            id: b.id,
            type: isCheckpoint ? 'checkpoint' : isDeployed ? 'deploy' : 'build',
            title: isCheckpoint
              ? `Checkpoint: ${b.checkpoint_name}`
              : `v${b.version_number} — ${b.prompt?.slice(0, 60) ?? 'Build'}`,
            subtitle: isDeployed ? 'Deployed to preview' : `Build ${b.status}`,
            timestamp: b.created_at,
            status: b.status === 'success' ? 'success' : b.status === 'error' ? 'error' : 'pending',
            buildId: b.id,
          };
        });

        setItems(activity);
      } finally {
        setLoading(false);
      }
    }

    loadActivity();

    // Realtime subscription for new builds
    const channel = supabase
      .channel(`activity:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_builds',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const b = payload.new as {
          id: string;
          version_number: number;
          status: string;
          prompt?: string;
          created_at: string;
          preview_url?: string;
          checkpoint_name?: string;
        };
        const newItem: ActivityItem = {
          id: b.id,
          type: b.checkpoint_name ? 'checkpoint' : b.preview_url ? 'deploy' : 'build',
          title: b.checkpoint_name
            ? `Checkpoint: ${b.checkpoint_name}`
            : `v${b.version_number} — ${b.prompt?.slice(0, 60) ?? 'Build'}`,
          subtitle: `Build ${b.status}`,
          timestamp: b.created_at,
          status: b.status === 'success' ? 'success' : 'pending',
          buildId: b.id,
        };
        setItems(prev => [newItem, ...prev].slice(0, maxItems));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, maxItems]);

  const displayItems = expanded ? items : items.slice(0, compact ? 3 : 5);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-400 text-sm">
        No activity yet. Start building!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {displayItems.map((item, i) => {
          const Icon = TYPE_ICON[item.type];
          const color = TYPE_COLOR[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 group transition-colors"
            >
              {/* Icon */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm text-zinc-800 truncate',
                  compact ? 'text-xs' : ''
                )}>
                  {item.title}
                </p>
                {item.subtitle && !compact && (
                  <p className="text-xs text-zinc-400 mt-0.5">{item.subtitle}</p>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{timeAgo(item.timestamp)}</span>
              </div>

              {/* Status dot */}
              {item.status && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2',
                  item.status === 'success' ? 'bg-green-500' :
                  item.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                )} />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Show more / less */}
      {items.length > (compact ? 3 : 5) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show {items.length - (compact ? 3 : 5)} more</>
          )}
        </button>
      )}
    </div>
  );
}
