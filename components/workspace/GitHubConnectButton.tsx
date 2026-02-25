'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, X, ExternalLink, Unlink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GitHubConnectButtonProps {
  projectId: string;
  currentRepoUrl?: string | null;
  onSynced?: (repoUrl: string) => void;
}

function parseOwnerRepo(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/|$)/);
  return match ? match[1] : repoUrl.replace('https://github.com/', '');
}

export default function GitHubConnectButton({
  projectId,
  currentRepoUrl,
  onSynced,
}: GitHubConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [commitMessage, setCommitMessage] = useState('Build from Argus');
  const [status, setStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handlePush = async () => {
    setStatus('pushing');
    setErrorMsg('');
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buildId: 'settings',
          repoUrl: repoUrl.trim() || undefined,
          files: [],
          commitMessage: commitMessage.trim() || 'Build from Argus',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GITHUB_NOT_CONNECTED') {
          setErrorMsg('Sign in with GitHub to connect your repository.');
        } else {
          setErrorMsg(data.error ?? 'Push failed');
        }
        setStatus('error');
        return;
      }

      setStatus('success');
      onSynced?.(data.repoUrl);
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 2000);
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buildId: 'disconnect',
          files: [],
          _disconnect: true,
        }),
      });
      // Optimistically clear — page should refresh
      window.location.reload();
    } catch {
      // best effort
    }
  };

  // Connected state
  if (currentRepoUrl) {
    const ownerRepo = parseOwnerRepo(currentRepoUrl);
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <Github size={16} className="text-zinc-900 flex-shrink-0" />
          <a
            href={currentRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1.5 min-w-0 truncate transition-colors"
          >
            <span className="truncate">github.com/{ownerRepo}</span>
            <ExternalLink size={12} className="flex-shrink-0" />
          </a>
        </div>
        <p className="text-xs text-zinc-400">
          Open the builder to sync your latest files to GitHub.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(currentRepoUrl, '_blank')}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            <Github size={14} />
            View on GitHub
          </button>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
          >
            <Unlink size={14} />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
      >
        <Github size={15} className="text-zinc-900" />
        Connect GitHub
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl z-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Github size={16} className="text-zinc-900" />
              <h3 className="text-sm font-bold text-zinc-900">Push to GitHub</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Repository URL
                <span className="text-zinc-400 font-normal ml-1">(leave blank to create new)</span>
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Commit message
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Build from Argus"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition-colors"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            {status === 'success' && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✓ Pushed successfully!
              </p>
            )}

            <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2">
              💡 Open the builder to sync your actual files. Settings sync creates the repo connection.
            </p>

            <button
              onClick={handlePush}
              disabled={status === 'pushing' || status === 'success'}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                status === 'pushing' || status === 'success'
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 text-white hover:bg-zinc-700'
              )}
            >
              {status === 'pushing' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Pushing...
                </>
              ) : status === 'success' ? (
                '✓ Pushed'
              ) : (
                <>
                  <Github size={14} />
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
