'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BuilderNav from '@/components/builder/BuilderNav';
import ChatPanel, { type ChatMessage } from '@/components/builder/ChatPanel';
import PreviewPanel from '@/components/builder/PreviewPanel';
import CodePanel, { type FileEntry } from '@/components/builder/CodePanel';
import VisualEditor from '@/components/builder/VisualEditor';
import PublishButton from '@/components/builder/PublishButton';
import DeploySuccessBanner from '@/components/builder/DeploySuccessBanner';
import { MODELS } from '@/components/builder/ModelSelector';
import VersionHistoryPanel from '@/components/builder/VersionHistoryPanel';
import VersionDiffBadge from '@/components/builder/VersionDiffBadge';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/client';
import { History } from 'lucide-react';

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
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    try {
      return localStorage.getItem(`argus_model_${projectId}`) ?? 'claude-sonnet-4-6';
    } catch {
      return 'claude-sonnet-4-6';
    }
  });

  const selectedModel = MODELS.find((m) => m.id === selectedModelId) ?? MODELS[0];

  /* ─── Chat ─── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  /* ─── Preview / Sandbox ─── */
  const [sandboxUrl, setSandboxUrl] = useState<string | undefined>(undefined);
  const [sandboxId, setSandboxId] = useState<string | undefined>(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  /* ─── Visual editor ─── */
  const [visualEditorActive, setVisualEditorActive] = useState(false);

  /* ─── Version history ─── */
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [buildCount, setBuildCount] = useState(0);

  /* ─── Code files ─── */
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  /* ─── Deploy / publish ─── */
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [showDeployBanner, setShowDeployBanner] = useState(false);

  /* ─── Load project name + conversation history on mount ─── */
  useEffect(() => {
    // Load project name
    const supabase = createClient();
    supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.name) setProjectName(data.name);
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
        if (data.sandboxId) setSandboxId(data.sandboxId);
      } else {
        setPreviewError('Failed to create sandbox');
      }
    } catch {
      setPreviewError('Failed to create sandbox');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    initSandbox();
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
      persistMessageToSupabase(userMsg);
      setIsGenerating(true);

      try {
        const res = await fetch('/api/generate-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content,
            model: selectedModelId,
            context: { sandboxId },
          }),
        });

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

        // Parse files from generated code
        const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
        const parsedFiles: FileEntry[] = [];
        let match;
        const changedFiles: string[] = [];
        while ((match = fileRegex.exec(generatedCode)) !== null) {
          parsedFiles.push({ path: match[1], content: match[2].trim() });
          changedFiles.push(match[1]);
        }

        if (parsedFiles.length > 0) setFiles(parsedFiles);

        const displayText = explanation || partialText || 'Done!';
        const aiMsg: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: displayText,
          timestamp: new Date(),
          fileChanges: changedFiles.length > 0 ? changedFiles : undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
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
      }
    },
    [selectedModelId, sandboxId, persistMessageToSupabase],
  );

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
    <div className="h-screen flex flex-col bg-[#080808] overflow-hidden">
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
            <VisualEditor
              isActive={visualEditorActive}
              onToggle={() => setVisualEditorActive((v) => !v)}
              iframeRef={iframeRef}
              onGeneratePrompt={handleVisualEditorPrompt}
            />
          </>
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
              <CodePanel
                files={files}
                buildLogs={buildLogs}
                onDownloadZip={handleDownloadZip}
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
    </div>
  );
}
