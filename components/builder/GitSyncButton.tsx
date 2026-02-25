'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileEntry } from '@/components/builder/CodePanel';

interface GitSyncButtonProps {
  projectId: string;
  buildId: string;
  files: FileEntry[];
  repoUrl?: string | null;
  onSynced?: (repoUrl: string) => void;
}

type SyncState =
  | 'idle-not-connected'
  | 'idle-connected'
  | 'syncing'
  | 'success'
  | 'error';

function parseOwnerRepo(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) return repoUrl;
  return match[1];
}

export default function GitSyncButton({
  projectId,
  buildId,
  files,
  repoUrl,
  onSynced,
}: GitSyncButtonProps) {
  const [syncState, setSyncState] = useState<SyncState>(
    repoUrl ? 'idle-connected' : 'idle-not-connected'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [connectRepoUrl, setConnectRepoUrl] = useState('');
  const [commitMessage, setCommitMessage] = useState('Build from Argus');
  const [connectStatus, setConnectStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [connectError, setConnectError] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Keep sync state in sync with repoUrl prop
  useEffect(() => {
    if (repoUrl && syncState === 'idle-not-connected') {
      setSyncState('idle-connected');
    } else if (!repoUrl && syncState === 'idle-connected') {
      setSyncState('idle-not-connected');
    }
  }, [repoUrl, syncState]);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  const handleSync = async () => {
    if (!repoUrl) {
      setPopoverOpen(true);
      return;
    }

    setSyncState('syncing');
    setErrorMsg('');

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buildId,
          repoUrl,
          files,
          commitMessage: 'Build from Argus',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GITHUB_NOT_CONNECTED') {
          setErrorMsg('Sign in with GitHub to enable sync.');
        } else {
          setErrorMsg(data.error ?? 'Sync failed');
        }
        setSyncState('error');
        // Reset after 4 seconds
        setTimeout(() => setSyncState('idle-connected'), 4000);
        return;
      }

      setSyncState('success');
      onSynced?.(data.repoUrl);
      setTimeout(() => setSyncState('idle-connected'), 3000);
    } catch {
      setErrorMsg('Network error');
      setSyncState('error');
      setTimeout(() => setSyncState('idle-connected'), 4000);
    }
  };

  const handleConnect = async () => {
    setConnectStatus('pushing');
    setConnectError('');
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buildId,
          repoUrl: connectRepoUrl.trim() || undefined,
          files,
          commitMessage: commitMessage.trim() || 'Build from Argus',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GITHUB_NOT_CONNECTED') {
          setConnectError('Sign in with GitHub OAuth to connect.');
        } else {
          setConnectError(data.error ?? 'Push failed');
        }
        setConnectStatus('error');
        return;
      }

      setConnectStatus('success');
      onSynced?.(data.repoUrl);
      setTimeout(() => {
        setPopoverOpen(false);
        setSyncState('idle-connected');
        setConnectStatus('idle');
      }, 2000);
    } catch {
      setConnectError('Network error');
      setConnectStatus('error');
    }
  };

  const getButtonContent = () => {
    switch (syncState) {
      case 'idle-not-connected':
        return (
          <>
            <Github className="w-3.5 h-3.5" />
            GitHub
          </>
        );
      case 'idle-connected':
        return (
          <>
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            {repoUrl ? parseOwnerRepo(repoUrl).split('/')[1] ?? 'GitHub' : 'Synced'}
          </>
        );
      case 'syncing':
        return (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Syncing...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            Pushed
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 max-w-[80px] truncate">{errorMsg || 'Error'}</span>
          </>
        );
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleSync}
        disabled={syncState === 'syncing' || syncState === 'success'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors',
          syncState === 'idle-not-connected' &&
            'text-[#888] hover:text-white border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]',
          syncState === 'idle-connected' &&
            'text-white border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] bg-[#1A2A1A]',
          syncState === 'syncing' &&
            'text-[#888] border-[rgba(255,255,255,0.08)] cursor-not-allowed',
          syncState === 'success' &&
            'text-green-400 border-green-900 bg-[#0F1F0F] cursor-not-allowed',
          syncState === 'error' &&
            'text-red-400 border-red-900 bg-[#1F0F0F]'
        )}
      >
        {getButtonContent()}
      </button>

      {/* Connect popover (shown when not connected) */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111] shadow-2xl z-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Github size={15} className="text-white" />
              <h3 className="text-sm font-bold text-white font-mono">Push to GitHub</h3>
            </div>
            <button
              onClick={() => setPopoverOpen(false)}
              className="rounded p-1 text-[#666] hover:text-white hover:bg-[#222] transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-[#888] mb-1.5">
                Repo URL
                <span className="text-[#555] ml-1">(blank = create new)</span>
              </label>
              <input
                type="text"
                value={connectRepoUrl}
                onChange={(e) => setConnectRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#1A1A1A] px-3 py-2 text-xs text-white placeholder-[#555] font-mono focus:border-[rgba(255,255,255,0.25)] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#888] mb-1.5">
                Commit message
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Build from Argus"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#1A1A1A] px-3 py-2 text-xs text-white placeholder-[#555] font-mono focus:border-[rgba(255,255,255,0.25)] focus:outline-none transition-colors"
              />
            </div>

            {connectStatus === 'error' && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2 font-mono">
                {connectError}
              </p>
            )}

            {connectStatus === 'success' && (
              <p className="text-xs text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg px-3 py-2 font-mono">
                ✓ Pushed successfully!
              </p>
            )}

            <button
              onClick={handleConnect}
              disabled={connectStatus === 'pushing' || connectStatus === 'success'}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-mono font-semibold transition-colors',
                connectStatus === 'pushing' || connectStatus === 'success'
                  ? 'bg-[#222] text-[#555] cursor-not-allowed'
                  : 'bg-white text-black hover:bg-zinc-200'
              )}
            >
              {connectStatus === 'pushing' ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Pushing...
                </>
              ) : connectStatus === 'success' ? (
                '✓ Pushed'
              ) : (
                <>
                  <Github size={13} />
                  Push to GitHub
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
