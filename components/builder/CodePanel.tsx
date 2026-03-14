'use client';

import { useState, useMemo, useCallback } from 'react';
import { Copy, Download, ChevronRight, ChevronDown, FileText, Check, Lock, LockOpen } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ─── Types ─── */
export interface FileEntry {
  path: string;
  content: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

/* ─── Helpers ─── */
function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const existing = current.find((n) => n.name === name);

      if (existing) {
        current = existing.children;
      } else {
        const node: TreeNode = {
          name,
          path: parts.slice(0, i + 1).join('/'),
          isDir: !isLast,
          children: [],
        };
        current.push(node);
        current = node.children;
      }
    }
  }

  // Sort: dirs first, then alphabetical
  const sortTree = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((n) => ({ ...n, children: sortTree(n.children) }))
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

  return sortTree(root);
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return 'typescript';
    case 'jsx':
    case 'js':
      return 'javascript';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'text';
  }
}

/* ─── Components ─── */
interface FileTreeItemProps {
  node: TreeNode;
  depth: number;
  selected: string | null;
  expanded: Set<string>;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  isLocked?: (filePath: string) => boolean;
  onToggleLock?: (filePath: string) => void;
}

function FileTreeItem({ node, depth, selected, expanded, onSelect, onToggle, isLocked, onToggleLock }: FileTreeItemProps) {
  const isOpen = expanded.has(node.path);
  const fileLocked = !node.isDir && isLocked?.(node.path);

  return (
    <>
      <div className="flex items-center group">
        <button
          onClick={() => (node.isDir ? onToggle(node.path) : onSelect(node.path))}
          className={`flex-1 flex items-center gap-1.5 py-1 text-left text-xs font-mono transition-colors rounded ${
            selected === node.path
              ? 'bg-[var(--editor-accent-15)] text-[var(--editor-accent)]'
              : 'text-[var(--editor-fg-muted)] hover:text-white hover:bg-[var(--editor-bg-hover)]/30'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {node.isDir ? (
            isOpen ? (
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
            )
          ) : (
            <FileText className="w-3 h-3 flex-shrink-0 opacity-50" />
          )}
          <span className="truncate">{node.name}</span>
          {fileLocked && <Lock className="w-2.5 h-2.5 flex-shrink-0 text-amber-500" />}
        </button>
        {!node.isDir && onToggleLock && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(node.path); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 mr-1 rounded hover:bg-[var(--editor-border)] transition-all"
            title={fileLocked ? 'Unlock file' : 'Lock file (AI cannot modify)'}
          >
            {fileLocked ? (
              <LockOpen className="w-3 h-3 text-amber-500" />
            ) : (
              <Lock className="w-3 h-3 text-[var(--editor-fg-dim)]" />
            )}
          </button>
        )}
      </div>
      {node.isDir && isOpen && node.children.map((child) => (
        <FileTreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selected={selected}
          expanded={expanded}
          onSelect={onSelect}
          onToggle={onToggle}
          isLocked={isLocked}
          onToggleLock={onToggleLock}
        />
      ))}
    </>
  );
}

/* ─── Main ─── */
interface CodePanelProps {
  files: FileEntry[];
  buildLogs?: string[];
  onDownloadZip?: () => void;
  /** Currently locked file paths */
  lockedFiles?: string[];
  /** Check if a specific file is locked */
  isLocked?: (filePath: string) => boolean;
  /** Toggle lock state of a file */
  onToggleLock?: (filePath: string) => void;
}

export default function CodePanel({ files, buildLogs = [], onDownloadZip, lockedFiles = [], isLocked, onToggleLock }: CodePanelProps) {
  const [tab, setTab] = useState<'files' | 'console'>('files');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand first-level dirs
    const dirs = new Set<string>();
    files.forEach((f) => {
      const first = f.path.split('/')[0];
      if (f.path.includes('/')) dirs.add(first);
    });
    return dirs;
  });
  const [copied, setCopied] = useState(false);

  const tree = useMemo(() => buildTree(files), [files]);

  const selectedContent = useMemo(() => {
    if (!selectedFile) return null;
    return files.find((f) => f.path === selectedFile)?.content ?? null;
  }, [selectedFile, files]);

  const handleToggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!selectedContent) return;
    await navigator.clipboard.writeText(selectedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedContent]);

  return (
    <div className="flex flex-col h-full bg-[var(--editor-bg-base)]">
      {/* Tabs */}
      <div className="flex items-center border-b border-[var(--editor-border-faint)] flex-shrink-0">
        {(['files', 'console'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-sans uppercase tracking-wider transition-colors border-b-2 ${
              tab === t
                ? 'text-white border-[var(--editor-accent)]'
                : 'text-[var(--editor-fg-tertiary)] border-transparent hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'files' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* File tree – top portion */}
          <div className="h-[45%] overflow-y-auto border-b border-[var(--editor-border-faint)] py-1 scrollbar-hide">
            {tree.length === 0 ? (
              <div className="text-[var(--editor-fg-dim)] text-xs font-sans text-center py-6">No files yet</div>
            ) : (
              tree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  depth={0}
                  selected={selectedFile}
                  expanded={expanded}
                  onSelect={setSelectedFile}
                  onToggle={handleToggle}
                  isLocked={isLocked}
                  onToggleLock={onToggleLock}
                />
              ))
            )}
          </div>

          {/* Code viewer – bottom portion */}
          <div className="flex-1 min-h-0 flex flex-col">
            {selectedContent !== null ? (
              <>
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--editor-bg-surface)] border-b border-[var(--editor-border-faint)] flex-shrink-0">
                  <span className="text-[11px] font-mono text-[var(--editor-fg-muted)] truncate">
                    {selectedFile}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-[var(--editor-fg-tertiary)] hover:text-white transition-colors rounded hover:bg-[var(--editor-bg-hover)]"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex-1 overflow-auto scrollbar-hide">
                  <SyntaxHighlighter
                    language={getLanguage(selectedFile!)}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '0.75rem',
                      fontSize: '0.7rem',
                      background: 'transparent',
                      lineHeight: '1.6',
                    }}
                    showLineNumbers
                  >
                    {selectedContent}
                  </SyntaxHighlighter>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-[var(--editor-fg-ghost)] text-xs font-sans">
                Select a file to view
              </div>
            )}
          </div>

          {/* Download ZIP */}
          {onDownloadZip && (
            <div className="border-t border-[var(--editor-border-faint)] p-2 flex-shrink-0">
              <button
                onClick={onDownloadZip}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--editor-bg-card)] hover:bg-[var(--editor-bg-hover)] text-[var(--editor-fg-muted)] hover:text-white text-xs font-sans transition-colors border border-[var(--editor-border-faint)]"
              >
                <Download className="w-3.5 h-3.5" />
                Download ZIP
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Console tab */
        <div className="flex-1 overflow-auto p-3 scrollbar-hide">
          {buildLogs.length === 0 ? (
            <div className="text-[var(--editor-fg-dim)] text-xs font-mono text-center py-6">
              No build logs yet
            </div>
          ) : (
            <pre className="text-[11px] font-mono text-[var(--editor-fg-tertiary)] whitespace-pre-wrap leading-relaxed">
              {buildLogs.join('\n')}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
