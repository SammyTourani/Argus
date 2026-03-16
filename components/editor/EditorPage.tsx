'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/client';
import { parseGeneratedFiles } from '@/lib/ai/parse-files';
import { History, Palette, Rocket } from 'lucide-react';

import Link from 'next/link';
import PublishButton from '@/components/builder/PublishButton';
import DeploySuccessBanner from '@/components/builder/DeploySuccessBanner';
import { MODELS } from '@/components/builder/ModelSelector';
import VersionHistoryPanel from '@/components/builder/VersionHistoryPanel';
import VersionDiffBadge from '@/components/builder/VersionDiffBadge';
import GitSyncButton from '@/components/builder/GitSyncButton';
import BuildStatusBar, { type BuildStatus } from '@/components/builder/BuildStatusBar';
import KeyboardShortcuts from '@/components/builder/KeyboardShortcuts';
import DesignSchemePanel from '@/components/builder/DesignSchemePanel';
import DeployHistory from '@/components/builder/DeployHistory';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import { useDesignScheme } from '@/hooks/use-design-scheme';
import { useLockedFiles } from '@/hooks/use-locked-files';
import { useMessageBranching } from '@/hooks/use-message-branching';
import type { FileEntry } from '@/components/builder/CodePanel';

import EditorLeftPanel from './EditorLeftPanel';
import EditorRightPanel from './EditorRightPanel';

import type {
  SandboxData,
  EditorChatMessage,
  GenerationProgress,
  CodeApplicationState,
  ConversationContext,
} from '@/types/editor';
import {
  INITIAL_GENERATION_PROGRESS,
  INITIAL_CONVERSATION_CONTEXT,
  EDITOR_CONFIG,
} from '@/types/editor';

/* ─── Conversation persistence ─── */
function loadConversation(projectId: string, buildId: string): EditorChatMessage[] {
  try {
    const key = `argus_chat_${projectId}_${buildId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}
function saveConversation(projectId: string, buildId: string, msgs: EditorChatMessage[]) {
  try {
    const key = `argus_chat_${projectId}_${buildId}`;
    localStorage.setItem(key, JSON.stringify(msgs.slice(-50)));
  } catch { /* noop */ }
}

interface EditorPageProps {
  projectId: string;
  buildId: string;
}

export default function EditorPage({ projectId, buildId }: EditorPageProps) {
  const router = useRouter();

  /* ─── Core state ─── */
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<EditorChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>(INITIAL_GENERATION_PROGRESS);
  const [codeApplicationState, setCodeApplicationState] = useState<CodeApplicationState>({ stage: null });
  const [conversationContext, setConversationContext] = useState<ConversationContext>(INITIAL_CONVERSATION_CONTEXT);

  /* ─── Preview state ─── */
  const [urlScreenshot, setUrlScreenshot] = useState<string | null>(null);
  const [isScreenshotLoaded, setIsScreenshotLoaded] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [isPreparingDesign, setIsPreparingDesign] = useState(false);

  /* ─── File explorer state ─── */
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'src', 'src/components']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  /* ─── Model ─── */
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-sonnet-4-6');
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`argus_model_${projectId}`);
      if (stored) setSelectedModelId(stored);
    } catch { /* noop */ }
  }, [projectId]);
  const selectedModel = MODELS.find((m) => m.id === selectedModelId) ?? MODELS[0];

  /* ─── Project metadata ─── */
  const [projectName, setProjectName] = useState('');
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  /* ─── Tab state ─── */
  const [activeTab, setActiveTab] = useState<'generation' | 'preview'>('preview');

  /* ─── Argus features ─── */
  const designScheme = useDesignScheme(projectId);
  const { lockedFiles } = useLockedFiles(projectId, buildId);
  const branching = useMessageBranching(projectId, buildId);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [buildStatusMessage, setBuildStatusMessage] = useState('');
  const [buildFilesChanged, setBuildFilesChanged] = useState(0);
  const [buildDuration, setBuildDuration] = useState(0);
  const buildStartTime = useRef(0);
  const [isGenerating, setIsGenerating] = useState(false);

  /* ─── Panels & overlays ─── */
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [deployHistoryOpen, setDeployHistoryOpen] = useState(false);
  const [designSchemeOpen, setDesignSchemeOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [showDeployBanner, setShowDeployBanner] = useState(false);
  const [buildCount, setBuildCount] = useState(0);

  /* ─── Code files (for builder components that need them) ─── */
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  /* ─── Refs ─── */
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sandboxIdRef = useRef<string | undefined>(undefined);
  const sandboxCreationRef = useRef(false);
  const sandboxPromiseRef = useRef<Promise<SandboxData | null> | null>(null);

  /* ─── Helpers ─── */
  const addChatMessage = useCallback(
    (content: string, type: EditorChatMessage['type'], metadata?: EditorChatMessage['metadata']) => {
      setChatMessages((prev) => {
        if (type === 'system' && prev.length > 0 && prev[prev.length - 1].type === 'system' && prev[prev.length - 1].content === content) {
          return prev;
        }
        return [...prev, { content, type, timestamp: new Date(), metadata }];
      });
    },
    []
  );

  const persistMessage = useCallback(
    async (role: string, content: string, fileChanges?: string[]) => {
      try {
        await fetch(`/api/projects/${projectId}/builds/${buildId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, content, file_changes: fileChanges ?? [] }),
        });
      } catch { /* non-blocking */ }
    },
    [projectId, buildId]
  );

  /* ─── Load project name + conversation history on mount ─── */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('projects')
      .select('name, github_repo_url')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.name) setProjectName(data.name);
        if ((data as any)?.github_repo_url) setRepoUrl((data as any).github_repo_url);
      });

    const history = loadConversation(projectId, buildId);
    if (history.length > 0) setChatMessages(history);
  }, [projectId, buildId]);

  /* ─── Persist conversation ─── */
  useEffect(() => {
    if (chatMessages.length > 0) saveConversation(projectId, buildId, chatMessages);
  }, [chatMessages, projectId, buildId]);

  /* ─── Create sandbox ─── */
  const createSandbox = useCallback(async (): Promise<SandboxData | null> => {
    if (sandboxCreationRef.current) return null;
    sandboxCreationRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxData(data);
        sandboxIdRef.current = data.sandboxId;
        return data;
      } else {
        throw new Error(data.error || 'Failed to create sandbox');
      }
    } catch (err: any) {
      addChatMessage(`Failed to create sandbox: ${err.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
      sandboxCreationRef.current = false;
    }
  }, [addChatMessage]);

  /* ─── Sandbox init + cleanup ─── */
  useEffect(() => {
    // Store the promise so auto-start can await sandbox readiness
    sandboxPromiseRef.current = createSandbox();
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

  /* ─── Auto-start from sessionStorage ─── */
  // Use a ref to survive React strict mode double-mount: the first mount reads
  // sessionStorage and saves values to the ref, then clears storage. The cleanup
  // cancels the timer, but the second mount can still read from the ref.
  const autoStartRef = useRef<{
    url: string;
    model: string | null;
    style: string | null;
    consumed: boolean;
  } | null>(null);

  useEffect(() => {
    // On first mount, read from sessionStorage and stash in the ref
    if (!autoStartRef.current) {
      const autoStart = sessionStorage.getItem('autoStart');
      const targetUrl = sessionStorage.getItem('targetUrl');
      if (autoStart !== 'true' || !targetUrl) return;

      autoStartRef.current = {
        url: targetUrl,
        model: sessionStorage.getItem('selectedModel'),
        style: sessionStorage.getItem('selectedStyle'),
        consumed: false,
      };

      // Clear sessionStorage immediately so it doesn't re-trigger on page refresh
      sessionStorage.removeItem('autoStart');
      sessionStorage.removeItem('targetUrl');
      sessionStorage.removeItem('selectedModel');
      sessionStorage.removeItem('selectedStyle');
      sessionStorage.removeItem('additionalInstructions');
      sessionStorage.removeItem('siteMarkdown');
      sessionStorage.removeItem('brandExtensionMode');
      sessionStorage.removeItem('brandExtensionPrompt');
    }

    // Skip if already consumed (prevents duplicate generation)
    const saved = autoStartRef.current;
    if (!saved || saved.consumed) return;
    saved.consumed = true;

    if (saved.model) setSelectedModelId(saved.model);

    const url = saved.url.match(/^https?:\/\//i) ? saved.url : `https://${saved.url}`;
    const cleanUrl = url.replace(/^https?:\/\//i, '');

    addChatMessage(`Starting to clone ${cleanUrl}...`, 'system');
    setIsPreparingDesign(true);

    // Wait for sandbox to be ready, then scrape + generate
    let cancelled = false;
    (async () => {
      try {
        // Wait for sandbox creation to complete (started in the other useEffect)
        addChatMessage('Preparing sandbox...', 'system');
        const sandboxResult = await sandboxPromiseRef.current;
        if (cancelled) return;
        if (!sandboxResult) {
          addChatMessage('Sandbox creation failed — retrying...', 'system');
          const retry = await createSandbox();
          if (cancelled) return;
          if (!retry) {
            addChatMessage('Could not create sandbox. Please try again.', 'error');
            setIsPreparingDesign(false);
            setUrlScreenshot(null);
            return;
          }
        }

        // Single Firecrawl call — returns markdown, rawHtml, branding, screenshot, images
        addChatMessage('Scraping website content...', 'system');
        const scrapeRes = await fetch('/api/scrape-url-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const scrapeData = await scrapeRes.json();
        if (!scrapeData.success) throw new Error(scrapeData.error || 'Scrape failed');

        if (cancelled) return;

        // Use screenshot from scrape response for UI preview (no separate captureUrlScreenshot call)
        if (scrapeData.screenshot) {
          setIsScreenshotLoaded(false);
          setUrlScreenshot(scrapeData.screenshot);
        }

        setConversationContext((prev) => ({
          ...prev,
          scrapedWebsites: [...prev.scrapedWebsites, { url, content: scrapeData, timestamp: new Date() }],
          currentProject: `${url} Clone`,
        }));

        const storedInstructions = saved.style ? `Style: ${saved.style}` : '';
        // Clean intent-based prompt — structured data is passed separately via cloneData
        const prompt = `Recreate this website as a pixel-perfect React clone: ${url}

=== TEXT CONTENT ===
${scrapeData.content}
${storedInstructions ? `\nADDITIONAL CONTEXT: ${storedInstructions}` : ''}`;

        await generateCode(prompt, {
          screenshotUrl: scrapeData.screenshot,
          scrapedHtml: scrapeData.html,
          structureSummary: scrapeData.structureSummary,
          scrapedStyles: scrapeData.styles,
          imageUrls: scrapeData.imageUrls,
          branding: scrapeData.branding,
        });
      } catch (err: any) {
        if (cancelled) return;
        addChatMessage(`Failed to clone website: ${err.message}`, 'error');
        setIsPreparingDesign(false);
        setUrlScreenshot(null);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Apply generated code to sandbox ─── */
  const applyGeneratedCode = useCallback(
    async (code: string, isEdit: boolean = false) => {
      setLoading(true);
      setCodeApplicationState({ stage: 'analyzing' });

      try {
        const res = await fetch('/api/apply-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response: code,
            isEdit,
            sandboxId: sandboxData?.sandboxId || sandboxIdRef.current,
          }),
        });

        if (!res.ok) throw new Error('Failed to apply code');

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              switch (data.type) {
                case 'start':
                case 'step':
                  if (data.message?.includes('Installing') && data.packages) {
                    setCodeApplicationState({ stage: 'installing', packages: data.packages });
                  } else if (data.message?.includes('Creating files') || data.message?.includes('Applying')) {
                    setCodeApplicationState({ stage: 'applying' });
                  }
                  break;
                case 'package-progress':
                  if (data.installedPackages) {
                    setCodeApplicationState((prev) => ({ ...prev, installedPackages: data.installedPackages }));
                  }
                  break;
                case 'complete':
                  setCodeApplicationState({ stage: 'complete' });
                  setTimeout(() => setCodeApplicationState({ stage: null }), 3000);

                  // Refresh iframe after code applied
                  const refreshDelay = data.results?.packagesInstalled?.length > 0
                    ? EDITOR_CONFIG.sandbox.packageInstallRefreshDelay
                    : EDITOR_CONFIG.sandbox.refreshDelay;
                  setTimeout(() => {
                    if (iframeRef.current) {
                      // Use sandboxData from closure, or fall back to iframe's current base URL
                      const url = sandboxData?.url || iframeRef.current.src.split('?')[0];
                      if (url) {
                        iframeRef.current.src = `${url}?t=${Date.now()}&applied=true`;
                      }
                    }
                  }, refreshDelay);

                  addChatMessage(
                    isEdit ? 'Edit applied successfully!' : `Applied ${data.results?.filesCreated?.length || 0} files!`,
                    'system'
                  );
                  break;
                case 'error':
                  addChatMessage(`Error: ${data.message || 'Unknown error'}`, 'error');
                  break;
              }
            } catch { /* parse error */ }
          }
        }
      } catch (err: any) {
        addChatMessage(`Failed to apply code: ${err.message}`, 'error');
      } finally {
        setLoading(false);
        setCodeApplicationState((prev) => (prev.stage === 'complete' ? prev : { stage: null }));
      }
    },
    [sandboxData, addChatMessage]
  );

  /* ─── Generate code (SSE stream) ─── */
  const generateCode = useCallback(
    async (prompt: string, cloneData?: {
      screenshotUrl?: string;
      scrapedHtml?: string;
      structureSummary?: string;
      scrapedStyles?: { colors?: string[]; fonts?: string[]; fontSizes?: string[] };
      imageUrls?: string[];
      branding?: any;
    }) => {
      setIsGenerating(true);
      setBuildStatus('generating');
      setBuildStatusMessage('Generating code...');
      buildStartTime.current = Date.now();

      const isEdit = conversationContext.appliedCode.length > 0;

      setGenerationProgress((prev) => ({
        ...prev,
        isGenerating: true,
        status: 'Starting AI generation...',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: false,
        isThinking: true,
        thinkingText: 'Analyzing your request...',
        currentFile: undefined,
        lastProcessedPosition: 0,
        isEdit,
        files: isEdit ? prev.files : [],
      }));

      try {
        // Get project context
        let projectContext: string | null = null;
        try {
          const ctxRes = await fetch(`/api/projects/${projectId}/summary`);
          if (ctxRes.ok) {
            const { summary } = await ctxRes.json();
            projectContext = summary?.contextString ?? null;
          }
        } catch { /* best-effort */ }

        const res = await fetch('/api/generate-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: selectedModelId,
            chatMode: 'build',
            lockedFiles,
            designScheme: designScheme.getPromptInjection(),
            isEdit,
            // Clone-specific fields (passed through to generation route for multimodal + structured context)
            ...(cloneData ? {
              screenshotUrl: cloneData.screenshotUrl,
              scrapedHtml: cloneData.scrapedHtml,
              structureSummary: cloneData.structureSummary,
              scrapedStyles: cloneData.scrapedStyles,
              imageUrls: cloneData.imageUrls,
              branding: cloneData.branding,
            } : {}),
            context: {
              sandboxId: sandboxData?.sandboxId || sandboxIdRef.current,
              projectContext: projectContext ?? undefined,
              conversationLength: chatMessages.length,
              conversationContext,
              recentMessages: chatMessages.slice(-EDITOR_CONFIG.ui.maxRecentMessagesContext),
            },
          }),
        });

        // Handle subscription limit
        if (res.status === 403) {
          try {
            const errData = await res.json();
            if (errData.code === 'BUILD_LIMIT_REACHED') {
              setShowUpgrade(true);
              return;
            }
          } catch { /* fall through */ }
        }
        if (!res.ok || !res.body) {
          let msg = 'Generation failed';
          try {
            const errData = await res.json();
            if (errData.error) msg = errData.error;
          } catch { /* use default */ }
          throw new Error(msg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let generatedCode = '';
        let explanation = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setGenerationProgress((prev) => ({ ...prev, status: data.message }));
              } else if (data.type === 'thinking') {
                setGenerationProgress((prev) => ({
                  ...prev,
                  isThinking: true,
                  thinkingText: (prev.thinkingText || '') + data.text,
                }));
              } else if (data.type === 'thinking_complete') {
                setGenerationProgress((prev) => ({
                  ...prev,
                  isThinking: false,
                  thinkingDuration: data.duration,
                }));
              } else if (data.type === 'conversation') {
                let text = data.text || '';
                text = text.replace(/<package>[^<]*<\/package>/g, '');
                text = text.replace(/<packages>[^<]*<\/packages>/g, '');
                if (!text.includes('<file') && !text.includes('import React') && !text.includes('export default') && text.trim().length > 0) {
                  addChatMessage(text.trim(), 'ai');
                }
              } else if (data.type === 'stream' && data.raw) {
                setGenerationProgress((prev) => {
                  const newCode = prev.streamedCode + data.text;
                  const updated = { ...prev, streamedCode: newCode, isStreaming: true, isThinking: false, status: 'Generating code...' };

                  // Parse complete files from stream
                  const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
                  let match;
                  const processedFiles = new Set(prev.files.map((f) => f.path));
                  while ((match = fileRegex.exec(newCode)) !== null) {
                    const filePath = match[1];
                    const fileContent = match[2];
                    if (!processedFiles.has(filePath)) {
                      const ext = filePath.split('.').pop() || '';
                      const fileType = ext === 'jsx' || ext === 'js' ? 'javascript' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : 'text';
                      const existingIdx = updated.files.findIndex((f) => f.path === filePath);
                      if (existingIdx >= 0) {
                        updated.files = [...updated.files.slice(0, existingIdx), { ...updated.files[existingIdx], content: fileContent.trim(), type: fileType, completed: true, edited: true }, ...updated.files.slice(existingIdx + 1)];
                      } else {
                        updated.files = [...updated.files, { path: filePath, content: fileContent.trim(), type: fileType, completed: true, edited: false }];
                      }
                      if (!prev.isEdit) updated.status = `Completed ${filePath}`;
                      processedFiles.add(filePath);
                    }
                  }

                  // Current file being generated
                  const lastFileMatch = newCode.match(/<file path="([^"]+)">([^]*?)$/);
                  if (lastFileMatch && !lastFileMatch[0].includes('</file>') && !processedFiles.has(lastFileMatch[1])) {
                    const ext = lastFileMatch[1].split('.').pop() || '';
                    const fileType = ext === 'jsx' || ext === 'js' ? 'javascript' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : 'text';
                    updated.currentFile = { path: lastFileMatch[1], content: lastFileMatch[2], type: fileType };
                    if (!prev.isEdit) updated.status = `Generating ${lastFileMatch[1]}`;
                  } else {
                    updated.currentFile = undefined;
                  }

                  return updated;
                });
              } else if (data.type === 'complete') {
                generatedCode = data.generatedCode ?? '';
                explanation = data.explanation ?? '';
                setConversationContext((prev) => ({ ...prev, lastGeneratedCode: generatedCode }));
                setGenerationProgress((prev) => ({
                  ...prev,
                  isGenerating: false,
                  isStreaming: false,
                  isThinking: false,
                  status: `Generated ${prev.files.length} files!`,
                }));
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch { /* parse error */ }
          }
        }

        // Parse files and apply
        if (generatedCode) {
          const parsed = parseGeneratedFiles(generatedCode);
          const parsedFiles: FileEntry[] = parsed.map((f) => ({ path: f.path, content: f.content }));
          const changedFiles = parsed.map((f) => f.path);

          if (parsedFiles.length > 0) {
            setFiles(parsedFiles);
            setBuildFilesChanged(parsedFiles.length);
            setBuildStatus('applying');
            setBuildStatusMessage(`Applying ${parsedFiles.length} files...`);
          }

          addChatMessage(explanation || 'Code generated!', 'ai', { appliedFiles: changedFiles });
          persistMessage('assistant', explanation || 'Code generated!', changedFiles);

          // Apply to sandbox
          await applyGeneratedCode(generatedCode, isEdit);

          // Clear screenshot states after generation
          setUrlScreenshot(null);
          setIsPreparingDesign(false);
          setScreenshotError(null);
        }
      } catch (err: any) {
        addChatMessage(`Error: ${err.message}`, 'error');
        setGenerationProgress(INITIAL_GENERATION_PROGRESS);
      } finally {
        setIsGenerating(false);
        const elapsed = Date.now() - buildStartTime.current;
        setBuildDuration(elapsed);
        setBuildStatus((prev) => (prev === 'error' ? 'error' : 'success'));
        setBuildStatusMessage('');
        setTimeout(() => setBuildStatus('idle'), 4000);
      }
    },
    [
      selectedModelId, sandboxData, lockedFiles, designScheme, chatMessages,
      conversationContext, projectId, addChatMessage, persistMessage,
      applyGeneratedCode,
    ]
  );

  /* ─── Send chat message ─── */
  const handleSendMessage = useCallback(async () => {
    const content = chatInput.trim();
    if (!content || isGenerating) return;

    addChatMessage(content, 'user');
    persistMessage('user', content);
    setChatInput('');

    try {
      branching.addMessage('user', content, undefined);
    } catch { /* noop */ }

    await generateCode(content);
  }, [chatInput, isGenerating, addChatMessage, persistMessage, branching, generateCode]);

  /* ─── Model change ─── */
  const handleModelChange = useCallback(
    (id: string) => {
      setSelectedModelId(id);
      try { localStorage.setItem(`argus_model_${projectId}`, id); } catch { /* noop */ }
    },
    [projectId]
  );

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === '/') { e.preventDefault(); setKeyboardShortcutsOpen((v) => !v); }
      if (e.key === 'Escape') { setVersionHistoryOpen(false); setKeyboardShortcutsOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ─── Build count for version badge ─── */
  useEffect(() => {
    if (!projectId || projectId === 'new') return;
    fetch(`/api/projects/${projectId}/builds`)
      .then((r) => r.json())
      .then((d) => setBuildCount((d.builds ?? []).length))
      .catch(() => { /* noop */ });
  }, [projectId]);

  /* ─── Version select ─── */
  const handleSelectVersion = useCallback(
    (selectedBuildId: string) => {
      setVersionHistoryOpen(false);
      router.push(`/workspace/${projectId}/build/${selectedBuildId}`);
    },
    [projectId, router]
  );

  /* ─── Publish success ─── */
  const handlePublishSuccess = useCallback((url: string) => {
    setDeployUrl(url);
    setShowDeployBanner(true);
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
      {/* Mobile fallback */}
      <div className="md:hidden flex flex-col items-center justify-center h-screen bg-white text-gray-900 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <h2 className="text-xl font-bold mb-2">Desktop Required</h2>
        <p className="text-gray-500 text-sm">The Argus builder requires a desktop browser.</p>
        <Link href="/workspace" className="mt-6 text-blue-600 hover:underline text-sm">← Back to workspace</Link>
      </div>

      {/* Desktop editor */}
      <div className="hidden md:flex h-screen flex-col bg-white overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-white py-2 px-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/workspace')} className="text-gray-500 hover:text-gray-700 transition-colors" title="Back to workspace">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{projectName || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="px-3 py-1.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 transition-colors"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              onClick={() => createSandbox()}
              className="p-2 rounded-lg transition-colors bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
              title="Create new sandbox"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={!sandboxData}
              className="p-2 rounded-lg transition-colors bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download as ZIP"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
            </button>
            <button
              onClick={() => setDeployHistoryOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Deploy history"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Deploys</span>
            </button>
            <button
              onClick={() => setDesignSchemeOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Design scheme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Design</span>
            </button>
            <button
              onClick={() => setVersionHistoryOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Version history"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">History</span>
            </button>
            {buildCount > 0 && (
              <VersionDiffBadge count={buildCount} onClick={() => setVersionHistoryOpen((o) => !o)} />
            )}
            <GitSyncButton
              projectId={projectId}
              buildId={buildId}
              files={files}
              repoUrl={repoUrl}
              onSynced={(url) => setRepoUrl(url)}
            />
            <PublishButton
              projectId={projectId}
              buildId={buildId}
              projectName={projectName || undefined}
              sandboxUrl={sandboxData?.url}
              files={files}
              onPublishSuccess={handlePublishSuccess}
            />
          </div>
        </div>

        {/* 2-panel layout: Left (Chat) | Right (Code/View) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Chat panel */}
          <EditorLeftPanel
            messages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            codeApplicationState={codeApplicationState}
            generationProgress={generationProgress}
            conversationContext={conversationContext}
            selectedModelName={selectedModel.name}
          />

          {/* RIGHT: Code/View panel */}
          <EditorRightPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            generationProgress={generationProgress}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            expandedFolders={expandedFolders}
            onToggleFolder={(path) => {
              setExpandedFolders((prev) => {
                const next = new Set(prev);
                if (next.has(path)) next.delete(path);
                else next.add(path);
                return next;
              });
            }}
            sandboxData={sandboxData}
            iframeRef={iframeRef}
            codeApplicationState={codeApplicationState}
            urlScreenshot={urlScreenshot}
            isScreenshotLoaded={isScreenshotLoaded}
            onScreenshotLoad={() => setIsScreenshotLoaded(true)}
            isCapturingScreenshot={isCapturingScreenshot}
            isPreparingDesign={isPreparingDesign}
            loading={loading}
            screenshotError={screenshotError}
          />
        </div>

        {/* Overlays */}
        <VersionHistoryPanel
          projectId={projectId}
          currentBuildId={buildId}
          onSelectVersion={handleSelectVersion}
          isOpen={versionHistoryOpen}
          onClose={() => setVersionHistoryOpen(false)}
        />

        {designSchemeOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setDesignSchemeOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="fixed right-0 top-0 h-full w-[340px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-900">Design Scheme</span>
                <button onClick={() => setDesignSchemeOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
              </div>
              <DesignSchemePanel projectId={projectId} />
            </div>
          </div>
        )}

        <KeyboardShortcuts isOpen={keyboardShortcutsOpen} onClose={() => setKeyboardShortcutsOpen(false)} />
        <BuildStatusBar status={buildStatus} message={buildStatusMessage} filesChanged={buildFilesChanged} duration={buildDuration} />
        {showDeployBanner && deployUrl && <DeploySuccessBanner url={deployUrl} onDismiss={() => setShowDeployBanner(false)} />}
        {showUpgrade && <UpgradePrompt feature="more builds" currentTier="free" onDismiss={() => setShowUpgrade(false)} />}
        <DeployHistory projectId={projectId} isOpen={deployHistoryOpen} onClose={() => setDeployHistoryOpen(false)} />
      </div>
    </>
  );
}
