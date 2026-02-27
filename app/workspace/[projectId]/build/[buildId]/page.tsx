'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BuilderNav from '@/components/builder/BuilderNav';
import ChatPanel, { type ChatMessage } from '@/components/builder/ChatPanel';
import type { ChatMode } from '@/lib/ai/chat-modes';
import PreviewPanel from '@/components/builder/PreviewPanel';
import LazyCodePanel from '@/components/builder/LazyCodeEditor';
import LazyVisualEditor from '@/components/builder/LazyVisualEditor';
import type { FileEntry } from '@/components/builder/CodePanel';
import PublishButton from '@/components/builder/PublishButton';
import DeploySuccessBanner from '@/components/builder/DeploySuccessBanner';
import { MODELS } from '@/components/builder/ModelSelector';
import VersionHistoryPanel from '@/components/builder/VersionHistoryPanel';
import VersionDiffBadge from '@/components/builder/VersionDiffBadge';
import GitSyncButton from '@/components/builder/GitSyncButton';
import BuildStatusBar, { type BuildStatus } from '@/components/builder/BuildStatusBar';
import KeyboardShortcuts from '@/components/builder/KeyboardShortcuts';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/client';
import { parseGeneratedFiles } from '@/lib/ai/parse-files';
import { History, MonitorX, Palette, Rocket } from 'lucide-react';
import Link from 'next/link';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import DeployHistory from '@/components/builder/DeployHistory';
import DesignSchemePanel from '@/components/builder/DesignSchemePanel';
import { useDesignScheme } from '@/hooks/use-design-scheme';
import { useLockedFiles } from '@/hooks/use-locked-files';
import { useMessageBranching } from '@/hooks/use-message-branching';

/* ─── Resizable panels ─── */
const MIN_LEFT = 220;
const MAX_LEFT = 500;
const MIN_RIGHT = 240;
const MAX_RIGHT = 520;

/* ─── Context persistence helpers ─── */
async function loadConversationHistory(projectId: string, buildId: string): Promise<ChatMessage[]> {
  try {
    const key = `argus_chat_${projectId}_${buildId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: ChatMessage) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveConversationHistory(projectId: string, buildId: string, messages: ChatMessage[]) {
  try {
    const key = `argus_chat_${projectId}_${buildId}`;
    // Keep last 50 messages to avoid localStorage bloat
    const toSave = messages.slice(-50);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch { /* noop */ }
}

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.projectId as string) ?? 'new';
  const buildId = (params?.buildId as string) ?? 'latest';

  /* ─── Panel visibility ─── */
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);

  /* ─── Panel widths (px) ─── */
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(340);

  /* ─── Project metadata ─── */
  const [projectName, setProjectName] = useState<string>('');

  /* ─── Model ─── */
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-sonnet-4-6');

  // Hydrate model selection from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`argus_model_${projectId}`);
      if (stored) setSelectedModelId(stored);
    } catch { /* noop — SSR or private browsing */ }
  }, [projectId]);

  const selectedModel = MODELS.find((m) => m.id === selectedModelId) ?? MODELS[0];

  /* ─── Chat ─── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('build');
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [buildStatusMessage, setBuildStatusMessage] = useState('');
  const [buildFilesChanged, setBuildFilesChanged] = useState(0);
  const [buildDuration, setBuildDuration] = useState(0);
  const buildStartTime = useRef<number>(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  /* ─── Preview / Sandbox ─── */
  const [sandboxUrl, setSandboxUrl] = useState<string | undefined>(undefined);
  const [sandboxId, setSandboxId] = useState<string | undefined>(undefined);
  const sandboxIdRef = useRef<string | undefined>(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  /* ─── Visual editor ─── */
  const [visualEditorActive, setVisualEditorActive] = useState(false);

  /* ─── Version history ─── */
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [buildCount, setBuildCount] = useState(0);

  /* ─── Upgrade prompt ─── */
  const [showUpgrade, setShowUpgrade] = useState(false);

  /* ─── Deploy history ─── */
  const [deployHistoryOpen, setDeployHistoryOpen] = useState(false);

  /* ─── Design scheme ─── */
  const [designSchemeOpen, setDesignSchemeOpen] = useState(false);
  const designScheme = useDesignScheme(projectId);
  const { lockedFiles, isLocked, toggleLock, getSystemPromptInjection } = useLockedFiles(projectId, buildId);
  const branching = useMessageBranching(projectId, buildId);

  /* ─── Code files ─── */
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  /* ─── Deploy / publish ─── */
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [showDeployBanner, setShowDeployBanner] = useState(false);

  /* ─── GitHub sync ─── */
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  /* ─── Load project name + conversation history on mount ─── */
  useEffect(() => {
    // Load project name + github repo url
    const supabase = createClient();
    supabase
      .from('projects')
      .select('name, github_repo_url')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.name) setProjectName(data.name);
        if ((data as Record<string, unknown> | null)?.github_repo_url) {
          setRepoUrl((data as Record<string, unknown>).github_repo_url as string);
        }
      });

    // Load conversation history
    loadConversationHistory(projectId, buildId).then((history) => {
      if (history.length > 0) setMessages(history);
      setHistoryLoaded(true);
    });
  }, [projectId, buildId]);

  /* ─── Persist conversation on every message change ─── */
  useEffect(() => {
    if (!historyLoaded) return;
    saveConversationHistory(projectId, buildId, messages);
  }, [messages, projectId, buildId, historyLoaded]);

  /* ─── Sandbox initialisation ─── */
  const initSandbox = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch('/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSandboxUrl(data.url);
        if (data.sandboxId) {
          setSandboxId(data.sandboxId);
          sandboxIdRef.current = data.sandboxId;
        }
      } else {
        setPreviewError(data.error || 'Failed to create sandbox');
      }
    } catch {
      setPreviewError('Failed to create sandbox');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    initSandbox();
    // Cleanup sandbox on unmount — use ref to avoid stale closure
    return () => {
      const id = sandboxIdRef.current;
      if (id) {
        fetch('/api/kill-sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxId: id }),
        }).catch(() => { /* best-effort cleanup */ });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Save messages to Supabase (server-side persistence, async, non-blocking) ─── */
  const persistMessageToSupabase = useCallback(async (message: ChatMessage) => {
    try {
      await fetch(`/api/projects/${projectId}/builds/${buildId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
          file_changes: message.fileChanges ?? [],
        }),
      });
    } catch { /* non-blocking */ }
  }, [projectId, buildId]);

  /* ─── Fetch project summary for AI context ─── */
  const getProjectContext = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/summary`);
      if (res.ok) {
        const { summary } = await res.json();
        return summary?.contextString ?? null;
      }
    } catch { /* non-blocking */ }
    return null;
  }, [projectId]);

  /* ─── Chat mode change ─── */
  const handleChatModeChange = useCallback((mode: ChatMode) => {
    setChatMode(mode);
  }, []);

  const handleBranchPrevious = useCallback((messageId: string) => {
    branching.switchToPrevious(messageId);
    // Sync branch info to the flat messages state
    const info = branching.getBranchInfo(messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, currentBranch: info.current - 1, totalBranches: info.total }
          : m
      )
    );
  }, [branching]);

  const handleBranchNext = useCallback((messageId: string) => {
    branching.switchToNext(messageId);
    // Sync branch info to the flat messages state
    const info = branching.getBranchInfo(messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, currentBranch: info.current - 1, totalBranches: info.total }
          : m
      )
    );
  }, [branching]);

  /* ─── Prompt enhancement ─── */
  const handleEnhancePrompt = useCallback((enhanced: string) => {
    // Enhanced prompt is handled internally by ChatPanel's PromptEnhancer
    // This callback is for any parent-level side effects
  }, []);

  /* ─── Chat send ─── */
  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      // Mirror to branching tree for branch navigation support
      try {
        branching.addMessage('user', content, undefined);
      } catch { /* noop — branching is additive */ }
      persistMessageToSupabase(userMsg);
      setIsGenerating(true);
      setBuildStatus('generating');
      setBuildStatusMessage('Generating code...');
      buildStartTime.current = Date.now();

      // Get project context for AI (non-blocking, best-effort)
      const projectContext = await getProjectContext();

      try {
        const res = await fetch('/api/generate-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content,
            model: selectedModelId,
            chatMode,
            lockedFiles,
            designScheme: designScheme.getPromptInjection(),
            context: {
              sandboxId,
              projectContext: projectContext ?? undefined,
              conversationLength: messages.length,
            },
          }),
        });

        if (res.status === 403) {
          try {
            const errorData = await res.json();
            if (errorData.code === 'BUILD_LIMIT_REACHED') {
              setShowUpgrade(true);
              setIsGenerating(false);
              setBuildStatus('idle');
              return;
            }
          } catch { /* fall through to generic error */ }
        }
        if (!res.ok || !res.body) throw new Error('Generation failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let generatedCode = '';
        let explanation = '';
        let partialText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'conversation') {
                partialText += data.text || '';
              } else if (data.type === 'complete') {
                generatedCode = data.generatedCode ?? '';
                explanation = data.explanation ?? '';
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              /* parse error – skip */
            }
          }
        }

        // Parse files from generated code using robust parser
        const rawParsed = parseGeneratedFiles(generatedCode);
        const parsedFiles: FileEntry[] = rawParsed.map(f => ({ path: f.path, content: f.content }));
        const changedFiles: string[] = rawParsed.map(f => f.path);

        if (parsedFiles.length > 0) {
          setFiles(parsedFiles);
          setBuildFilesChanged(parsedFiles.length);
          setBuildStatus('applying');
          setBuildStatusMessage(`Applying ${parsedFiles.length} files...`);
        }

        const displayText = explanation || partialText || 'Done!';
        const aiMsg: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: displayText,
          timestamp: new Date(),
          fileChanges: changedFiles.length > 0 ? changedFiles : undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
        // Mirror to branching tree
        try {
          branching.addMessage('assistant', displayText, {
            fileChanges: changedFiles.length > 0 ? changedFiles : undefined,
          });
        } catch { /* noop */ }
        persistMessageToSupabase(aiMsg);

        // Apply code to sandbox
        if (generatedCode) {
          setBuildLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Applying ${parsedFiles.length} files...`]);
          try {
            const applyRes = await fetch('/api/apply-ai-code-stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ response: generatedCode, isEdit: false }),
            });

            if (applyRes.ok && applyRes.body) {
              const applyReader = applyRes.body.getReader();
              const applyDecoder = new TextDecoder();
              while (true) {
                const { done: d2, value: v2 } = await applyReader.read();
                if (d2) break;
                const applyChunk = applyDecoder.decode(v2, { stream: true });
                const applyLines = applyChunk.split('\n');
                for (const aLine of applyLines) {
                  if (!aLine.startsWith('data: ')) continue;
                  try {
                    const ad = JSON.parse(aLine.slice(6));
                    if (ad.type === 'complete') {
                      setBuildLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Code applied successfully`]);
                    } else if (ad.type === 'error') {
                      setBuildLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${ad.message}`]);
                    }
                  } catch { /* skip */ }
                }
              }
            }
          } catch (applyErr) {
            setBuildLogs((prev) => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] Apply error: ${applyErr instanceof Error ? applyErr.message : 'Unknown'}`,
            ]);
          }
        }
      } catch (err) {
        const errMsg: ChatMessage = {
          id: nanoid(),
          role: 'system',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsGenerating(false);
        const elapsed = Date.now() - buildStartTime.current;
        setBuildDuration(elapsed);
        setBuildStatus(prev => prev === 'error' ? 'error' : 'success');
        setBuildStatusMessage('');
        // Reset to idle after 4 seconds
        setTimeout(() => setBuildStatus('idle'), 4000);
      }
    },
    [selectedModelId, sandboxId, persistMessageToSupabase, getProjectContext, messages.length],
  );

  /* ─── Branch navigation (stub — wire to your branch state management) ─── */
  const handleRegenerate = useCallback((messageId: string) => {
    // Create a new branch in the branching tree
    try {
      branching.regenerate(messageId);
    } catch {
      // Fallback: branching hook may not have this message yet
    }
    // Find the assistant message and the preceding user message, then resend
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex < 0) return;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        handleSendMessage(messages[i].content);
        break;
      }
    }
  }, [messages, handleSendMessage, branching]);


  /* ─── Fetch build count for version badge ─── */
  useEffect(() => {
    if (!projectId || projectId === 'new') return;
    fetch(`/api/projects/${projectId}/builds`)
      .then((r) => r.json())
      .then((d) => setBuildCount((d.builds ?? []).length))
      .catch(() => {/* noop */});
  }, [projectId]);

  /* ─── Version select handler ─── */
  const handleSelectVersion = useCallback(
    (selectedBuildId: string) => {
      setVersionHistoryOpen(false);
      router.push(`/workspace/${projectId}/build/${selectedBuildId}`);
    },
    [projectId, router]
  );

  /* ─── Visual editor prompt handler ─── */
  const handleVisualEditorPrompt = useCallback((prompt: string) => {
    setVisualEditorActive(false);
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  /* ─── Model change ─── */
  const handleModelChange = useCallback(
    (id: string) => {
      setSelectedModelId(id);
      try { localStorage.setItem(`argus_model_${projectId}`, id); } catch { /* noop */ }
    },
    [projectId],
  );

  /* ─── Drag resize ─── */
  const dragging = useRef<'left' | 'right' | null>(null);

  const onMouseDown = useCallback((side: 'left' | 'right') => {
    dragging.current = side;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      if (dragging.current === 'left') {
        setLeftWidth(Math.max(MIN_LEFT, Math.min(MAX_LEFT, e.clientX)));
      } else {
        setRightWidth(Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, window.innerWidth - e.clientX)));
      }
    };
    const onMouseUp = () => {
      dragging.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  /* ─── Global keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === '/') { e.preventDefault(); setKeyboardShortcutsOpen(prev => !prev); }
      if (meta && e.key === 'k') { e.preventDefault(); /* focus chat input — ChatPanel handles this via ref */ }
      if (meta && e.shiftKey && e.key === 'e') { e.preventDefault(); setRightVisible(prev => !prev); }
      if (meta && e.shiftKey && e.key === 'v') { e.preventDefault(); setVisualEditorActive(prev => !prev); }
      if (e.key === 'Escape') { setVisualEditorActive(false); setVersionHistoryOpen(false); setKeyboardShortcutsOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ─── Publish success handler ─── */
  const handlePublishSuccess = useCallback((url: string) => {
    setDeployUrl(url);
    setShowDeployBanner(true);
    setBuildLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ✅ Deployed: ${url}`,
    ]);
  }, []);

  /* ─── Download ZIP ─── */
  const handleDownloadZip = useCallback(async () => {
    try {
      const res = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.dataUrl) {
        const a = document.createElement('a');
        a.href = data.dataUrl;
        a.download = data.fileName || 'project.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch { /* noop */ }
  }, []);

  return (
    <>
      {/* Mobile fallback — builder requires desktop */}
      <div className="md:hidden flex flex-col items-center justify-center h-screen bg-[#0A0A0A] text-white p-8 text-center">
        <MonitorX className="w-12 h-12 text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Desktop Required</h2>
        <p className="text-zinc-400 text-sm">The Argus builder requires a desktop browser.<br/>Please open this on a larger screen.</p>
        <Link href="/workspace" className="mt-6 text-[#FA4500] hover:underline text-sm">← Back to workspace</Link>
      </div>

      {/* Desktop builder */}
    <div className="hidden md:flex h-screen flex-col bg-[#080808] overflow-hidden">
      <BuilderNav
        projectName={projectName || `Project ${projectId.slice(0, 6)}`}
        projectId={projectId}
        selectedModelId={selectedModelId}
        onModelChange={handleModelChange}
        leftPanelVisible={leftVisible}
        onToggleLeft={() => setLeftVisible((v) => !v)}
        rightPanelVisible={rightVisible}
        onToggleRight={() => setRightVisible((v) => !v)}
        extraActions={
          <>
            {/* Deploy history button */}
            <button
              onClick={() => setDeployHistoryOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#888] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
              title="Deploy history"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deploys</span>
            </button>
            {/* Design scheme button */}
            <button
              onClick={() => setDesignSchemeOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#888] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
              title="Design scheme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Design</span>
            </button>
            {/* Version history button + badge */}
            <button
              onClick={() => setVersionHistoryOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#888] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
              title="Version history"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            {buildCount > 0 && (
              <VersionDiffBadge
                count={buildCount}
                onClick={() => setVersionHistoryOpen((o) => !o)}
              />
            )}
            <LazyVisualEditor
              isActive={visualEditorActive}
              onToggle={() => setVisualEditorActive((v) => !v)}
              iframeRef={iframeRef}
              onGeneratePrompt={handleVisualEditorPrompt}
            />
            <GitSyncButton
              projectId={projectId}
              buildId={buildId}
              files={files}
              repoUrl={repoUrl}
              onSynced={(url) => setRepoUrl(url)}
            />
          </>
        }
        publishSlot={
          <PublishButton
            projectId={projectId}
            buildId={buildId}
            projectName={projectName || undefined}
            sandboxUrl={sandboxUrl}
            files={files}
            onPublishSuccess={handlePublishSuccess}
          />
        }
      />

      {/* 3-panel grid */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Chat panel */}
        {leftVisible && (
          <>
            <div style={{ width: leftWidth, minWidth: MIN_LEFT, maxWidth: MAX_LEFT }} className="flex-shrink-0 border-r border-[rgba(255,255,255,0.06)]">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                selectedModelName={selectedModel.name}
                selectedModelColor={selectedModel.color}
                chatMode={chatMode}
                onChatModeChange={handleChatModeChange}
                onEnhancePrompt={handleEnhancePrompt}
                onRegenerate={handleRegenerate}
                onBranchPrevious={handleBranchPrevious}
                onBranchNext={handleBranchNext}
              />
            </div>
            <div
              onMouseDown={() => onMouseDown('left')}
              className="w-1 cursor-col-resize hover:bg-[#FA4500]/40 active:bg-[#FA4500]/60 transition-colors flex-shrink-0"
            />
          </>
        )}

        {/* CENTER: Preview (pass iframeRef) */}
        <div className="flex-1 min-w-0 relative">
          <PreviewPanel
            sandboxUrl={sandboxUrl}
            isLoading={previewLoading}
            isGenerating={isGenerating}
            error={previewError}
            onRetry={initSandbox}
            iframeRef={iframeRef}
          />
        </div>

        {/* RIGHT: Code panel */}
        {rightVisible && (
          <>
            <div
              onMouseDown={() => onMouseDown('right')}
              className="w-1 cursor-col-resize hover:bg-[#FA4500]/40 active:bg-[#FA4500]/60 transition-colors flex-shrink-0"
            />
            <div style={{ width: rightWidth, minWidth: MIN_RIGHT, maxWidth: MAX_RIGHT }} className="flex-shrink-0 border-l border-[rgba(255,255,255,0.06)]">
              <LazyCodePanel
                files={files}
                buildLogs={buildLogs}
                onDownloadZip={handleDownloadZip}
                lockedFiles={lockedFiles}
                isLocked={isLocked}
                onToggleLock={toggleLock}
              />
            </div>
          </>
        )}
      </div>

      {/* Version History Panel */}
      <VersionHistoryPanel
        projectId={projectId}
        currentBuildId={buildId}
        onSelectVersion={handleSelectVersion}
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
      />

      {/* Design Scheme Panel */}
      {designSchemeOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDesignSchemeOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="fixed right-0 top-0 h-full w-[340px] bg-[#0A0A0A] border-l border-zinc-800 z-50 flex flex-col shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-mono text-white">Design Scheme</span>
              <button onClick={() => setDesignSchemeOpen(false)} className="text-zinc-500 hover:text-white">
                &times;
              </button>
            </div>
            <DesignSchemePanel projectId={projectId} />
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts isOpen={keyboardShortcutsOpen} onClose={() => setKeyboardShortcutsOpen(false)} />

      {/* Build Status Bar */}
      <BuildStatusBar
        status={buildStatus}
        message={buildStatusMessage}
        filesChanged={buildFilesChanged}
        duration={buildDuration}
      />

      {/* Deploy Success Banner */}
      {showDeployBanner && deployUrl && (
        <DeploySuccessBanner
          url={deployUrl}
          onDismiss={() => setShowDeployBanner(false)}
        />
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgrade && (
        <UpgradePrompt
          feature="more builds"
          currentTier="free"
          dark
          onDismiss={() => setShowUpgrade(false)}
        />
      )}

      {/* Deploy History Panel */}
      <DeployHistory
        projectId={projectId}
        isOpen={deployHistoryOpen}
        onClose={() => setDeployHistoryOpen(false)}
      />
    </div>
    </>
  );
}
