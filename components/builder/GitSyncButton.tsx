'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Github,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  GitBranch,
  RefreshCw,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGitHubStatus } from '@/hooks/use-github-status';
import GitHubRepoSelector from '@/components/builder/GitHubRepoSelector';
import type { FileEntry } from '@/components/builder/CodePanel';

interface GitSyncButtonProps {
  projectId: string;
  buildId: string;
  files: FileEntry[];
  repoUrl?: string | null;
  onSynced?: (repoUrl: string) => void;
  onPulled?: (files: FileEntry[]) => void;
  versionNumber?: number;
}

type SyncState =
  | 'idle-not-connected'
  | 'idle-connected'
  | 'syncing'
  | 'pulling'
  | 'success'
  | 'error';

type PopoverTab = 'push' | 'pull';

interface RepoItem {
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  updated_at: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
}

interface BranchItem {
  name: string;
  protected: boolean;
}

function parseOwnerRepo(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) return repoUrl;
  return match[1];
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const LAST_SYNC_KEY = 'argus_last_sync';

function getLastSync(projectId: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LAST_SYNC_KEY}_${projectId}`);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

function setLastSync(projectId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LAST_SYNC_KEY}_${projectId}`, Date.now().toString());
  } catch {
    // localStorage unavailable
  }
}

export default function GitSyncButton({
  projectId,
  buildId,
  files,
  repoUrl,
  onSynced,
  onPulled,
  versionNumber,
}: GitSyncButtonProps) {
  const github = useGitHubStatus();

  const [syncState, setSyncState] = useState<SyncState>(
    repoUrl ? 'idle-connected' : 'idle-not-connected'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PopoverTab>('push');

  // Repo selection
  const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [createNewMode, setCreateNewMode] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');

  // Branch selection
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  // Commit message
  const defaultCommitMsg = `Argus build${versionNumber ? ` v${versionNumber}` : ''}`;
  const [commitMessage, setCommitMessage] = useState(defaultCommitMsg);

  // Popover state
  const [connectStatus, setConnectStatus] = useState<'idle' | 'pushing' | 'pulling' | 'success' | 'error'>('idle');
  const [connectError, setConnectError] = useState('');

  // Last sync timestamp
  const [lastSyncTs, setLastSyncTs] = useState<number | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  // Load last sync timestamp
  useEffect(() => {
    setLastSyncTs(getLastSync(projectId));
  }, [projectId]);

  // Keep sync state in sync with repoUrl prop
  useEffect(() => {
    if (repoUrl && syncState === 'idle-not-connected') {
      setSyncState('idle-connected');
    } else if (!repoUrl && syncState === 'idle-connected') {
      setSyncState('idle-not-connected');
    }
  }, [repoUrl, syncState]);

  // If we have an existing repoUrl, pre-populate selectedRepo
  useEffect(() => {
    if (repoUrl && !selectedRepo) {
      const ownerRepo = parseOwnerRepo(repoUrl);
      const [, repoName] = ownerRepo.split('/');
      setSelectedRepo({
        name: repoName ?? ownerRepo,
        full_name: ownerRepo,
        description: null,
        private: false,
        default_branch: 'main',
        updated_at: new Date().toISOString(),
        html_url: repoUrl,
        stargazers_count: 0,
        language: null,
      });
    }
  }, [repoUrl, selectedRepo]);

  // Update commit message when version changes
  useEffect(() => {
    setCommitMessage(`Argus build${versionNumber ? ` v${versionNumber}` : ''}`);
  }, [versionNumber]);

  // Fetch branches when a repo is selected
  const fetchBranches = useCallback(async (repoFullName: string) => {
    setBranchesLoading(true);
    try {
      const res = await fetch(`/api/github/branches?repo=${encodeURIComponent(repoFullName)}`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches ?? []);
        setDefaultBranch(data.default_branch ?? 'main');
        setSelectedBranch(data.default_branch ?? 'main');
      } else {
        setBranches([]);
        setSelectedBranch('main');
      }
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchBranches(selectedRepo.full_name);
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [selectedRepo, fetchBranches]);

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

  // Close branch dropdown on outside click
  useEffect(() => {
    if (!branchDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [branchDropdownOpen]);

  // Quick sync for already-connected repos
  const handleQuickSync = async () => {
    if (!repoUrl && !selectedRepo) {
      setPopoverOpen(true);
      return;
    }

    const targetRepoUrl = repoUrl ?? (selectedRepo ? selectedRepo.html_url : null);
    if (!targetRepoUrl) {
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
          repoUrl: targetRepoUrl,
          files,
          commitMessage: defaultCommitMsg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GITHUB_NOT_CONNECTED') {
          setErrorMsg('Connect GitHub to enable sync');
        } else if (data.code === 'GITHUB_TOKEN_EXPIRED') {
          setErrorMsg('GitHub token expired. Reconnect.');
        } else {
          setErrorMsg(data.error ?? 'Sync failed');
        }
        setSyncState('error');
        setTimeout(() => setSyncState(repoUrl ? 'idle-connected' : 'idle-not-connected'), 4000);
        return;
      }

      setLastSync(projectId);
      setLastSyncTs(Date.now());
      setSyncState('success');
      onSynced?.(data.repoUrl);
      setTimeout(() => setSyncState('idle-connected'), 3000);
    } catch {
      setErrorMsg('Network error');
      setSyncState('error');
      setTimeout(() => setSyncState(repoUrl ? 'idle-connected' : 'idle-not-connected'), 4000);
    }
  };

  // Push from popover (with repo selector + branch + commit message)
  const handlePush = async () => {
    setConnectStatus('pushing');
    setConnectError('');

    const targetRepoUrl = selectedRepo ? selectedRepo.html_url : undefined;
    const targetRepoName = createNewMode && newRepoName.trim() ? newRepoName.trim() : undefined;

    if (!targetRepoUrl && !createNewMode) {
      setConnectError('Select a repository or create a new one');
      setConnectStatus('error');
      return;
    }

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buildId,
          repoUrl: targetRepoUrl,
          repoName: targetRepoName,
          files,
          commitMessage: commitMessage.trim() || defaultCommitMsg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GITHUB_NOT_CONNECTED') {
          setConnectError('Sign in with GitHub OAuth to connect.');
        } else if (data.code === 'GITHUB_TOKEN_EXPIRED') {
          setConnectError('GitHub token expired. Click "Reconnect GitHub" below.');
        } else {
          setConnectError(data.error ?? 'Push failed');
        }
        setConnectStatus('error');
        return;
      }

      setLastSync(projectId);
      setLastSyncTs(Date.now());
      setConnectStatus('success');
      onSynced?.(data.repoUrl);
      setTimeout(() => {
        setPopoverOpen(false);
        setSyncState('idle-connected');
        setConnectStatus('idle');
        setCreateNewMode(false);
      }, 2000);
    } catch {
      setConnectError('Network error');
      setConnectStatus('error');
    }
  };

  // Pull from GitHub
  const handlePull = async () => {
    const targetRepoUrl = repoUrl ?? (selectedRepo ? selectedRepo.html_url : null);
    if (!targetRepoUrl) {
      setConnectError('No repo connected to pull from');
      setConnectStatus('error');
      return;
    }

    setConnectStatus('pulling');
    setConnectError('');

    try {
      const res = await fetch('/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          repoUrl: targetRepoUrl,
          branch: selectedBranch || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GITHUB_NOT_CONNECTED') {
          setConnectError('Connect GitHub to pull files.');
        } else {
          setConnectError(data.error ?? 'Pull failed');
        }
        setConnectStatus('error');
        return;
      }

      setConnectStatus('success');
      if (onPulled && data.files) {
        onPulled(data.files as FileEntry[]);
      }
      setTimeout(() => {
        setPopoverOpen(false);
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
            Pushing...
          </>
        );
      case 'pulling':
        return (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Pulling...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            Done
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

  const isBusy = syncState === 'syncing' || syncState === 'pulling' || syncState === 'success';

  return (
    <div className="relative" ref={popoverRef}>
      {/* Main button row */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleQuickSync}
          disabled={isBusy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans border transition-colors',
            syncState === 'idle-not-connected' &&
              'text-[var(--editor-fg-muted)] hover:text-white border-[var(--editor-border)] hover:border-[var(--editor-border-hover)]',
            syncState === 'idle-connected' &&
              'text-white border-[var(--editor-border)] hover:border-[var(--editor-border-hover)] bg-[#1A2A1A]',
            syncState === 'syncing' &&
              'text-[var(--editor-fg-muted)] border-[var(--editor-border)] cursor-not-allowed',
            syncState === 'pulling' &&
              'text-[var(--editor-fg-muted)] border-[var(--editor-border)] cursor-not-allowed',
            syncState === 'success' &&
              'text-green-400 border-green-900 bg-[#0F1F0F] cursor-not-allowed',
            syncState === 'error' &&
              'text-red-400 border-red-900 bg-[#1F0F0F]'
          )}
        >
          {getButtonContent()}
        </button>

        {/* Dropdown arrow to open popover */}
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          disabled={isBusy}
          className={cn(
            'flex items-center px-1.5 py-1.5 rounded-lg text-xs border transition-colors',
            isBusy
              ? 'border-[var(--editor-border-faint)] text-[var(--editor-fg-ghost)] cursor-not-allowed'
              : 'border-[var(--editor-border)] text-[var(--editor-fg-tertiary)] hover:text-white hover:border-[var(--editor-border-hover)]'
          )}
        >
          <ChevronDown size={11} className={cn('transition-transform', popoverOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Last sync indicator */}
      {lastSyncTs && syncState === 'idle-connected' && (
        <div className="absolute right-0 top-full mt-0.5 flex items-center gap-1 text-[10px] font-mono text-[var(--editor-fg-ghost)]">
          <Clock size={8} />
          {formatTimestamp(lastSyncTs)}
        </div>
      )}

      {/* Enhanced popover */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-[360px] rounded-xl border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] shadow-2xl shadow-black/50 z-50">
          {/* Header with tabs */}
          <div className="flex items-center justify-between border-b border-[var(--editor-border-faint)] px-4 pt-4 pb-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('push'); setConnectError(''); setConnectStatus('idle'); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-sans font-medium rounded-t-lg border-b-2 transition-colors',
                  activeTab === 'push'
                    ? 'text-white border-[var(--editor-accent)]'
                    : 'text-[var(--editor-fg-tertiary)] border-transparent hover:text-[var(--editor-fg-muted)]'
                )}
              >
                <ArrowUpFromLine size={12} />
                Push
              </button>
              <button
                onClick={() => { setActiveTab('pull'); setConnectError(''); setConnectStatus('idle'); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-sans font-medium rounded-t-lg border-b-2 transition-colors',
                  activeTab === 'pull'
                    ? 'text-white border-[var(--editor-accent)]'
                    : 'text-[var(--editor-fg-tertiary)] border-transparent hover:text-[var(--editor-fg-muted)]'
                )}
              >
                <ArrowDownToLine size={12} />
                Pull
              </button>
            </div>
            <button
              onClick={() => setPopoverOpen(false)}
              className="rounded p-1 text-[var(--editor-fg-tertiary)] hover:text-white hover:bg-[var(--editor-bg-hover)] transition-colors mb-2"
            >
              <X size={13} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* GitHub connection status */}
            {!github.connected && !github.loading && (
              <div className="flex items-center gap-2 rounded-lg bg-[#1A1200] border border-[var(--editor-accent-20)] px-3 py-2">
                <AlertCircle size={12} className="text-[var(--editor-accent)] flex-shrink-0" />
                <p className="text-xs font-sans text-[var(--editor-accent)] flex-1">GitHub not connected</p>
                <button
                  onClick={github.reconnect}
                  className="text-xs font-sans font-semibold text-[var(--editor-accent)] hover:text-white transition-colors"
                >
                  Connect
                </button>
              </div>
            )}

            {/* Repo selector */}
            <div>
              <label className="block text-xs font-sans text-[var(--editor-fg-muted)] mb-1.5">
                Repository
              </label>
              {createNewMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="my-new-repo"
                    className="flex-1 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-bg-card)] px-3 py-2 text-xs text-white placeholder-[var(--editor-fg-dim)] font-mono focus:border-[var(--editor-border-hover)] focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => { setCreateNewMode(false); setNewRepoName(''); }}
                    className="rounded p-1.5 text-[var(--editor-fg-tertiary)] hover:text-white hover:bg-[var(--editor-bg-hover)] transition-colors"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <GitHubRepoSelector
                  selectedRepo={selectedRepo}
                  onSelect={setSelectedRepo}
                  onCreateNew={() => { setSelectedRepo(null); setCreateNewMode(true); }}
                  disabled={connectStatus === 'pushing' || connectStatus === 'pulling'}
                  githubConnected={github.connected}
                  onConnectGitHub={github.reconnect}
                />
              )}
            </div>

            {/* Branch selector */}
            {(selectedRepo || repoUrl) && !createNewMode && (
              <div>
                <label className="block text-xs font-sans text-[var(--editor-fg-muted)] mb-1.5">
                  Branch
                </label>
                <div className="relative" ref={branchRef}>
                  <button
                    type="button"
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    disabled={branchesLoading}
                    className={cn(
                      'flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-xs font-mono transition-colors',
                      branchesLoading
                        ? 'border-[var(--editor-border-faint)] bg-[var(--editor-bg-surface)] text-[var(--editor-fg-dim)]'
                        : 'border-[var(--editor-border)] bg-[var(--editor-bg-card)] text-white hover:border-[var(--editor-border-hover)]'
                    )}
                  >
                    <GitBranch size={12} className="flex-shrink-0 text-[var(--editor-fg-muted)]" />
                    {branchesLoading ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        <span className="text-[var(--editor-fg-dim)]">Loading...</span>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-left truncate">
                          {selectedBranch || defaultBranch}
                        </span>
                        {selectedBranch === defaultBranch && (
                          <span className="text-[10px] text-[var(--editor-fg-dim)] flex-shrink-0">default</span>
                        )}
                      </>
                    )}
                    <ChevronDown size={10} className={cn(
                      'flex-shrink-0 text-[var(--editor-fg-dim)] transition-transform',
                      branchDropdownOpen && 'rotate-180'
                    )} />
                  </button>

                  {branchDropdownOpen && branches.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] shadow-xl z-50 max-h-[160px] overflow-y-auto">
                      {branches.map((b) => (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() => {
                            setSelectedBranch(b.name);
                            setBranchDropdownOpen(false);
                          }}
                          className={cn(
                            'flex items-center gap-2 w-full px-3 py-2 text-xs font-mono transition-colors hover:bg-[var(--editor-bg-card)]',
                            selectedBranch === b.name ? 'text-white bg-[var(--editor-bg-card)]' : 'text-[var(--editor-fg-muted)]'
                          )}
                        >
                          <GitBranch size={10} className="flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{b.name}</span>
                          {b.name === defaultBranch && (
                            <span className="text-[10px] text-[var(--editor-fg-dim)]">default</span>
                          )}
                          {b.protected && (
                            <span className="text-[10px] text-yellow-500/70">protected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Push tab content */}
            {activeTab === 'push' && (
              <>
                <div>
                  <label className="block text-xs font-sans text-[var(--editor-fg-muted)] mb-1.5">
                    Commit message
                  </label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder={defaultCommitMsg}
                    className="w-full rounded-lg border border-[var(--editor-border)] bg-[var(--editor-bg-card)] px-3 py-2 text-xs text-white placeholder-[var(--editor-fg-dim)] font-mono focus:border-[var(--editor-border-hover)] focus:outline-none transition-colors"
                  />
                </div>

                {/* File count indicator */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--editor-fg-dim)]">
                  <span>{files.length} file{files.length !== 1 ? 's' : ''} to push</span>
                  {lastSyncTs && (
                    <>
                      <span className="text-[var(--editor-fg-ghost)]">|</span>
                      <span className="flex items-center gap-1">
                        <Clock size={8} />
                        Last sync {formatTimestamp(lastSyncTs)}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Pull tab content */}
            {activeTab === 'pull' && (
              <div className="rounded-lg bg-[var(--editor-bg-surface)] border border-[var(--editor-border-faint)] px-3 py-2.5">
                <p className="text-xs font-sans text-[var(--editor-fg-muted)]">
                  Pull the latest files from{' '}
                  <span className="text-white font-mono">
                    {selectedRepo?.full_name ?? (repoUrl ? parseOwnerRepo(repoUrl) : 'GitHub')}
                  </span>
                  {selectedBranch && (
                    <>
                      {' '}on branch <span className="text-white font-mono">{selectedBranch}</span>
                    </>
                  )}
                  . This will replace your current builder files.
                </p>
              </div>
            )}

            {/* Error / Success messages */}
            {connectStatus === 'error' && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2 font-sans">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p>{connectError}</p>
                  {(connectError.includes('token expired') || connectError.includes('OAuth')) && (
                    <button
                      onClick={github.reconnect}
                      className="mt-1 text-xs font-semibold text-red-300 hover:text-white transition-colors underline underline-offset-2"
                    >
                      Reconnect GitHub
                    </button>
                  )}
                </div>
              </div>
            )}

            {connectStatus === 'success' && (
              <p className="text-xs text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg px-3 py-2 font-sans flex items-center gap-2">
                <CheckCircle2 size={12} />
                {activeTab === 'push' ? 'Pushed successfully!' : 'Pulled successfully!'}
              </p>
            )}

            {/* Action button */}
            {activeTab === 'push' ? (
              <button
                onClick={handlePush}
                disabled={connectStatus === 'pushing' || connectStatus === 'success' || (!selectedRepo && !createNewMode)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-sans font-semibold transition-colors',
                  connectStatus === 'pushing' || connectStatus === 'success' || (!selectedRepo && !createNewMode)
                    ? 'bg-[var(--editor-bg-hover)] text-[var(--editor-fg-dim)] cursor-not-allowed'
                    : 'bg-white text-black hover:bg-zinc-200'
                )}
              >
                {connectStatus === 'pushing' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Pushing...
                  </>
                ) : connectStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={12} />
                    Pushed
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine size={12} />
                    Push to GitHub
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePull}
                disabled={connectStatus === 'pulling' || connectStatus === 'success' || (!selectedRepo && !repoUrl)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-sans font-semibold transition-colors',
                  connectStatus === 'pulling' || connectStatus === 'success' || (!selectedRepo && !repoUrl)
                    ? 'bg-[var(--editor-bg-hover)] text-[var(--editor-fg-dim)] cursor-not-allowed'
                    : 'bg-white text-black hover:bg-zinc-200'
                )}
              >
                {connectStatus === 'pulling' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Pulling...
                  </>
                ) : connectStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={12} />
                    Pulled
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={12} />
                    Pull from GitHub
                  </>
                )}
              </button>
            )}

            {/* Reconnect link if connected but token might be stale */}
            {github.connected && (
              <button
                onClick={() => {
                  github.refresh();
                }}
                className="flex items-center gap-1.5 text-[10px] font-sans text-[var(--editor-fg-ghost)] hover:text-[var(--editor-fg-muted)] transition-colors mx-auto"
              >
                <RefreshCw size={8} />
                Refresh connection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
