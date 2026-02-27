'use client';

import { useEffect, useState } from 'react';
import { Layers, Hammer, Rocket, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkspaceStats } from '@/app/api/workspace/stats/route';

interface StatCardProps {
  icon: typeof Layers;
  label: string;
  value: number | null;
  index: number;
}

function StatCard({ icon: Icon, label, value, index }: StatCardProps) {
  const isLoading = value === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FA4500]/10">
        <Icon className="h-4.5 w-4.5 text-[#FA4500]/70" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        {isLoading ? (
          <div className="mt-0.5 h-5 w-10 animate-pulse rounded bg-zinc-100" />
        ) : (
          <p className="text-[18px] font-bold leading-tight text-zinc-900">
            {value.toLocaleString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function UsageStatsBar() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch('/api/workspace/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data: WorkspaceStats = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  // On error, hide the component gracefully
  if (error) return null;

  const statItems = [
    { icon: Layers, label: 'Total Projects', value: stats?.totalProjects ?? null },
    { icon: Hammer, label: 'Total Builds', value: stats?.totalBuilds ?? null },
    { icon: Rocket, label: 'Deploys This Month', value: stats?.deploysThisMonth ?? null },
    { icon: Zap, label: 'API Calls Today', value: stats?.apiCallsToday ?? null },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statItems.map((item, i) => (
        <StatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          index={i}
        />
      ))}
    </div>
  );
}
