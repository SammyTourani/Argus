'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Mic, Paperclip } from 'lucide-react';
import type { EditorChatMessage, GenerationProgress, CodeApplicationState, ConversationContext } from '@/types/editor';
import type { ChatMode } from '@/lib/ai/chat-modes';
import ChatModeToggle from '@/components/builder/ChatModeToggle';
import PromptEnhancer from '@/components/builder/PromptEnhancer';

interface EditorLeftPanelProps {
  messages: EditorChatMessage[];
  chatInput: string;
  onChatInputChange: (v: string) => void;
  onSendMessage: () => void;
  isGenerating: boolean;
  codeApplicationState: CodeApplicationState;
  generationProgress: GenerationProgress;
  conversationContext: ConversationContext;
  selectedModelName: string;
  chatMode?: ChatMode;
  onChatModeChange?: (mode: ChatMode) => void;
  projectContext?: string;
  onComingSoon?: (feature: string) => void;
}

export default function EditorLeftPanel({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  isGenerating,
  codeApplicationState,
  generationProgress,
  conversationContext,
  selectedModelName,
  chatMode = 'build',
  onChatModeChange,
  projectContext,
  onComingSoon,
}: EditorLeftPanelProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, generationProgress.files.length, codeApplicationState.stage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [chatInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex-1 max-w-[400px] flex flex-col border-r border-[var(--editor-border)] bg-[var(--editor-bg-base)]">
      {/* Scraped website info */}
      {conversationContext.scrapedWebsites.length > 0 && (
        <div className="p-4 bg-[var(--editor-bg-surface)] border-b border-[var(--editor-border)]">
          <div className="flex flex-col gap-3">
            {conversationContext.scrapedWebsites.map((site, idx) => {
              const sourceURL = site.url;
              const hostname = (() => { try { return new URL(sourceURL).hostname; } catch { return sourceURL; } })();
              const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
              const siteName = hostname.replace(/^www\./, '');

              return (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={favicon} alt={siteName} className="w-4 h-4 rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <a href={sourceURL} target="_blank" rel="noopener noreferrer" className="text-[var(--editor-fg-primary)] hover:text-[var(--editor-accent)] truncate max-w-[250px] font-medium">
                    {siteName}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide" ref={chatMessagesRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className="block">
            <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="block">
                <div className={`block rounded-xl px-3.5 py-2 ${
                  msg.type === 'user' ? 'bg-[var(--editor-accent)] text-white ml-auto max-w-[80%]' :
                  msg.type === 'ai' ? 'bg-[var(--editor-bg-card)] text-[var(--editor-fg-secondary)] mr-auto max-w-[80%]' :
                  msg.type === 'system' ? 'bg-[var(--editor-bg-card)] text-[var(--editor-fg-tertiary)] text-sm' :
                  msg.type === 'command' ? 'bg-[var(--editor-bg-card)] text-[var(--editor-fg-primary)] font-mono text-sm' :
                  msg.type === 'error' ? 'bg-red-900 text-red-100 text-sm border border-red-700' :
                  'bg-[var(--editor-bg-card)] text-[var(--editor-fg-tertiary)] text-sm'
                }`}>
                  {msg.type === 'command' ? (
                    <div className="flex items-start gap-2">
                      <span className={`text-xs ${
                        msg.metadata?.commandType === 'input' ? 'text-blue-400' :
                        msg.metadata?.commandType === 'error' ? 'text-red-400' :
                        msg.metadata?.commandType === 'success' ? 'text-green-400' : 'text-[var(--editor-fg-muted)]'
                      }`}>
                        {msg.metadata?.commandType === 'input' ? '$' : '>'}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap text-[var(--editor-fg-primary)]">{msg.content}</span>
                    </div>
                  ) : msg.type === 'error' ? (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-red-800 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Error</div>
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm">{msg.content}</span>
                  )}
                </div>

                {/* Applied files chips */}
                {msg.metadata?.appliedFiles && msg.metadata.appliedFiles.length > 0 && (
                  <div className="mt-3 inline-block bg-[var(--editor-bg-card)] rounded-xl p-3">
                    <div className="text-sm font-mono font-medium mb-2 text-[var(--editor-fg-secondary)]">
                      {msg.content.includes('Applied') ? 'Files Updated:' : 'Generated Files:'}
                    </div>
                    <div className="flex flex-wrap items-start gap-1.5">
                      {msg.metadata.appliedFiles.map((filePath, fileIdx) => {
                        const fileName = filePath.split('/').pop() || filePath;
                        const ext = fileName.split('.').pop() || '';
                        const dotColor = ext === 'css' ? 'bg-blue-400' : (ext === 'jsx' || ext === 'js') ? 'bg-yellow-400' : ext === 'json' ? 'bg-green-400' : 'bg-[var(--editor-fg-muted)]';
                        return (
                          <div key={`applied-${fileIdx}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--editor-bg-elevated)] text-[var(--editor-fg-primary)] rounded-lg text-sm" style={{ animationDelay: `${fileIdx * 30}ms` }}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            {fileName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Code application progress */}
        {codeApplicationState.stage && codeApplicationState.stage !== 'complete' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--editor-bg-card)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 border-2 border-[var(--editor-fg-ghost)] border-t-[var(--editor-accent)] rounded-full animate-spin" />
              <span className="text-sm font-medium text-[var(--editor-fg-secondary)]">
                {codeApplicationState.stage === 'analyzing' && 'Analyzing code...'}
                {codeApplicationState.stage === 'installing' && 'Installing packages...'}
                {codeApplicationState.stage === 'applying' && 'Applying changes...'}
              </span>
            </div>
            {codeApplicationState.stage === 'installing' && codeApplicationState.packages && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {codeApplicationState.packages.map((pkg, i) => (
                  <span key={i} className={`px-2 py-0.5 text-xs rounded-full transition-all ${codeApplicationState.installedPackages?.includes(pkg) ? 'bg-[var(--editor-success)]/20 text-[var(--editor-success)]' : 'bg-[var(--editor-bg-hover)] text-[var(--editor-fg-muted)]'}`}>
                    {pkg}{codeApplicationState.installedPackages?.includes(pkg) && ' ✓'}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* File generation progress (inline during generation) */}
        {generationProgress.isGenerating && (
          <div className="inline-block bg-[var(--editor-bg-card)] rounded-lg p-3">
            <div className="text-sm font-mono font-medium mb-2 text-[var(--editor-fg-secondary)]">{generationProgress.status}</div>
            <div className="flex flex-wrap items-start gap-1">
              {generationProgress.files.map((file, idx) => (
                <div key={`file-${idx}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--editor-bg-elevated)] text-[var(--editor-fg-primary)] rounded-lg text-xs" style={{ animationDelay: `${idx * 30}ms` }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {file.path.split('/').pop()}
                </div>
              ))}
              {generationProgress.currentFile && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[var(--editor-accent-20)] text-[var(--editor-fg-primary)] rounded-lg text-xs animate-pulse">
                  <div className="w-3 h-3 border-2 border-[var(--editor-fg-primary)] border-t-transparent rounded-full animate-spin" />
                  {generationProgress.currentFile.path.split('/').pop()}
                </div>
              )}
            </div>

            {generationProgress.streamedCode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 border-t border-[var(--editor-border)] pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[var(--editor-success)] rounded-full animate-pulse" />
                  <span className="text-xs font-mono font-medium text-[var(--editor-fg-muted)]">AI Response Stream</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-[var(--editor-border)] to-transparent" />
                </div>
                <div className="bg-[var(--editor-bg-deep)] border border-[var(--editor-border)] rounded max-h-32 overflow-y-auto scrollbar-hide">
                  <SyntaxHighlighter language="jsx" style={vscDarkPlus} customStyle={{ margin: 0, padding: '0.75rem', fontSize: '11px', lineHeight: '1.5', background: 'transparent', maxHeight: '8rem', overflow: 'hidden' }}>
                    {generationProgress.streamedCode.slice(-1000)}
                  </SyntaxHighlighter>
                  <span className="inline-block w-2 h-3 bg-[var(--editor-accent)] ml-3 mb-3 animate-pulse" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-3 border-t border-[var(--editor-border-faint)] bg-[var(--editor-bg-surface)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-[var(--editor-accent)] animate-pulse' : 'bg-[var(--editor-success)]'}`} />
            <span className="text-xs text-[var(--editor-fg-tertiary)] font-medium">{isGenerating ? 'Generating...' : 'System Ready'}</span>
          </div>
          <span className="text-xs font-mono text-[var(--editor-fg-muted)]">{selectedModelName}</span>
        </div>
      </div>

      {/* Chat input */}
      <div className="p-3 border-t border-[var(--editor-border-faint)]">
        {/* Mode toggle row */}
        {onChatModeChange && (
          <div className="flex items-center gap-2 mb-2">
            <ChatModeToggle mode={chatMode} onChange={onChatModeChange} disabled={isGenerating} />
            <span className="text-[10px] font-mono text-[var(--editor-fg-dim)]">⌘↵ to send</span>
          </div>
        )}
        <div className="relative rounded-xl border border-[var(--editor-border)] bg-[var(--editor-bg-elevated)] focus-within:border-[var(--editor-accent)] focus-within:ring-1 focus-within:ring-[var(--editor-accent-30)] transition-all">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-[var(--editor-fg-primary)] placeholder-[var(--editor-fg-dim)] focus:outline-none"
            rows={1}
            disabled={isGenerating}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onComingSoon?.('File upload')}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--editor-fg-dim)] hover:text-[var(--editor-accent)] hover:bg-[var(--editor-accent-10)] transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <PromptEnhancer
                prompt={chatInput}
                onAccept={(enhanced) => onChatInputChange(enhanced)}
                onDismiss={() => {}}
                projectContext={projectContext}
                disabled={isGenerating || !chatInput.trim()}
              />
              <button
                onClick={() => onComingSoon?.('Voice mode')}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--editor-fg-dim)] hover:text-[var(--editor-accent)] hover:bg-[var(--editor-accent-10)] transition-colors"
                title="Voice mode"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={onSendMessage}
              disabled={isGenerating || !chatInput.trim()}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--editor-accent)] text-white hover:bg-[var(--editor-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
