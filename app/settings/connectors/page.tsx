'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plug, Loader2, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ConnectorDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  popular: boolean;
}

const CONNECTORS: ConnectorDef[] = [
  { id: 'github', name: 'GitHub', desc: 'Manage repos, track changes, collaborate', icon: 'https://github.githubassets.com/favicons/favicon-dark.svg', popular: true },
  { id: 'gmail', name: 'Gmail', desc: 'Draft replies, search inbox, summarize threads', icon: 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png', popular: true },
  { id: 'slack', name: 'Slack', desc: 'Team messaging and real-time notifications', icon: 'https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png', popular: true },
  { id: 'notion', name: 'Notion', desc: 'Docs, wikis, and project management', icon: 'https://www.notion.so/images/favicon.ico', popular: false },
  { id: 'linear', name: 'Linear', desc: 'Issue tracking and project planning', icon: 'https://linear.app/favicon.ico', popular: false },
  { id: 'figma', name: 'Figma', desc: 'Design files and prototypes', icon: 'https://static.figma.com/app/icon/1/favicon.png', popular: false },
  { id: 'vercel', name: 'Vercel', desc: 'Deploy and host web applications', icon: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico', popular: false },
  { id: 'google-drive', name: 'Google Drive', desc: 'Access files, search, and manage documents', icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png', popular: false },
  { id: 'google-calendar', name: 'Google Calendar', desc: 'Manage events and optimize your schedule', icon: 'https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png', popular: false },
  { id: 'stripe', name: 'Stripe', desc: 'Payment processing and billing', icon: 'https://images.stripeassets.com/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg', popular: false },
  { id: 'jira', name: 'Jira', desc: 'Project and issue tracking', icon: 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png', popular: false },
];

export default function SettingsConnectorsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());

  const loadStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/user/connectors');
      if (res.ok) {
        const { connectors } = await res.json();
        const connected = new Set<string>();
        (connectors || []).forEach((c: { provider: string; status: string }) => {
          if (c.status === 'connected') connected.add(c.provider);
        });
        setConnectedProviders(connected);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleConnect = async (connector: ConnectorDef) => {
    if (connector.id === 'github') {
      // GitHub uses OAuth — redirect to GitHub auth
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      if (clientId) {
        const redirectUri = `${window.location.origin}/auth/callback`;
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,read:user`;
      } else {
        toast.info('GitHub integration is being configured.');
      }
      return;
    }
    toast.info(`${connector.name} integration coming soon.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const recommended = CONNECTORS.filter(c => c.popular);
  const others = CONNECTORS.filter(c => !c.popular);

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
      {/* Recommended */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-1">Connectors</h2>
        <p className="text-sm text-zinc-500 mb-6">Connect external services to enhance your workflow.</p>

        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recommended</h3>
        <div className="grid gap-3">
          {recommended.map(c => {
            const isConnected = connectedProviders.has(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
                <img src={c.icon} alt="" className="h-8 w-8 rounded-lg object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-400">{c.desc}</p>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-600">
                    <Check size={12} /> Connected
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnect(c)}
                    className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Connect <ExternalLink size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Others */}
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 mt-6">All Apps</h3>
        <div className="grid gap-3">
          {others.map(c => {
            const isConnected = connectedProviders.has(c.id);
            return (
              <div key={c.id} className={cn('flex items-center gap-3 rounded-lg border border-zinc-200 p-3', !isConnected && 'opacity-60')}>
                <img src={c.icon} alt="" className="h-8 w-8 rounded-lg object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-400">{c.desc}</p>
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-600">
                    <Check size={12} /> Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-400 uppercase">Coming Soon</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
