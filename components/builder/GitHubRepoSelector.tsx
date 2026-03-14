'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Github, Lock, Globe, Search, Plus, Loader2, AlertCircle, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface GitHubRepoSelectorProps {
  selectedRepo: RepoItem | null;
  onSelect: (repo: RepoItem | null) => void;
  onCreateNew: () => void;
  disabled?: boolean;
  githubConnected: boolean;
  onConnectGitHub: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function GitHubRepoSelector({
  selectedRepo,
  onSelect,
  onCreateNew,
  disabled = false,
  githubConnected,
  onConnectGitHub,
}: GitHubRepoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/github/repos?per_page=50&sort=updated');
      if (!res.ok) {
        const data = await res.json();
        if (data.code === 'GITHUB_NOT_CONNECTED' || data.code === 'GITHUB_TOKEN_EXPIRED') {
          setError('GitHub not connected');
        } else {
          setError(data.error ?? 'Failed to load repos');
        }
        return;
      }
      const data = await res.json();
      setRepos(data.repos ?? []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch repos when dropdown opens
  useEffect(() => {
    if (open && githubConnected) {
      fetchRepos();
    }
  }, [open, githubConnected, fetchRepos]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const filteredRepos = search
    ? repos.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : repos;

  const handleSelect = (repo: RepoItem) => {
    onSelect(repo);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  // Not connected state
  if (!githubConnected) {
    return (
      <button
        type="button"
        onClick={onConnectGitHub}
        className="flex items-center gap-2 w-full rounded-lg border border-dashed border-[var(--editor-border)] bg-[var(--editor-bg-surface)] px-3 py-2.5 text-xs font-sans text-[var(--editor-fg-muted)] hover:text-white hover:border-[var(--editor-border-hover)] transition-colors"
      >
        <Github size={13} />
        Connect GitHub to select a repo
      </button>
    );
  }

  // Selected repo pill
  if (selectedRepo && !open) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono transition-colors min-w-0',
            disabled
              ? 'border-[var(--editor-border-faint)] bg-[var(--editor-bg-surface)] text-[var(--editor-fg-dim)] cursor-not-allowed'
              : 'border-[var(--editor-border)] bg-[var(--editor-bg-surface)] text-white hover:border-[var(--editor-border-hover)]'
          )}
        >
          <Github size={12} className="flex-shrink-0 text-[var(--editor-fg-muted)]" />
          <span className="truncate">{selectedRepo.full_name}</span>
          {selectedRepo.private ? (
            <Lock size={10} className="flex-shrink-0 text-[var(--editor-fg-tertiary)]" />
          ) : (
            <Globe size={10} className="flex-shrink-0 text-[var(--editor-fg-tertiary)]" />
          )}
          <ChevronDown size={10} className="flex-shrink-0 text-[var(--editor-fg-dim)]" />
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="rounded p-1 text-[var(--editor-fg-dim)] hover:text-white hover:bg-[var(--editor-bg-hover)] transition-colors"
          title="Clear selection"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 w-full rounded-lg border px-3 py-2.5 text-xs font-sans transition-colors',
          disabled
            ? 'border-[var(--editor-border-faint)] bg-[var(--editor-bg-surface)] text-[var(--editor-fg-dim)] cursor-not-allowed'
            : 'border-[var(--editor-border)] bg-[var(--editor-bg-surface)] text-[var(--editor-fg-muted)] hover:text-white hover:border-[var(--editor-border-hover)]'
        )}
      >
        <Github size={13} className="flex-shrink-0" />
        <span className="flex-1 text-left">Select a repository...</span>
        <ChevronDown size={12} className={cn('flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Search */}
          <div className="border-b border-[var(--editor-border-faint)] px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--editor-bg-base)] border border-[var(--editor-border)] px-2.5 py-1.5">
              <Search size={12} className="flex-shrink-0 text-[var(--editor-fg-dim)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="flex-1 bg-transparent text-xs font-mono text-white placeholder-[var(--editor-fg-dim)] focus:outline-none"
              />
            </div>
          </div>

          {/* Create new option */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSearch('');
              onCreateNew();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-sans text-[var(--editor-accent)] hover:bg-[var(--editor-bg-card)] transition-colors border-b border-[var(--editor-border-faint)]"
          >
            <Plus size={13} className="flex-shrink-0" />
            Create new repository
          </button>

          {/* Repo list */}
          <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 size={16} className="animate-spin text-[var(--editor-fg-dim)]" />
                <p className="text-xs font-sans text-[var(--editor-fg-dim)]">Loading repos...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-8 px-4">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-xs font-sans text-red-400 text-center">{error}</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-8">
                <p className="text-xs font-sans text-[var(--editor-fg-dim)]">
                  {search ? 'No repos match your search' : 'No repositories found'}
                </p>
              </div>
            ) : (
              filteredRepos.map((repo) => (
                <button
                  key={repo.full_name}
                  type="button"
                  onClick={() => handleSelect(repo)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-[var(--editor-bg-card)] transition-colors',
                    selectedRepo?.full_name === repo.full_name && 'bg-[var(--editor-bg-card)]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white truncate">{repo.name}</span>
                      {repo.private ? (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--editor-bg-hover)] text-[var(--editor-fg-muted)] flex-shrink-0">
                          <Lock size={8} />
                          private
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1A2A1A] text-green-400/70 flex-shrink-0">
                          <Globe size={8} />
                          public
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-[10px] font-sans text-[var(--editor-fg-dim)] truncate mt-0.5">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--editor-fg-ghost)] flex-shrink-0">
                    {formatRelativeDate(repo.updated_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
