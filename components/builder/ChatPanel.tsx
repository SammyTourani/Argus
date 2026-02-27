'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMode } from '@/lib/ai/chat-modes';
import ChatModeToggle from '@/components/builder/ChatModeToggle';
import PromptEnhancer from '@/components/builder/PromptEnhancer';
import BranchPicker from '@/components/builder/BranchPicker';
import { finalizeMarkdown, extractCodeBlocks } from '@/lib/ai/streaming-markdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  fileChanges?: string[];
  /** Branch tracking for BranchPicker */
  currentBranch?: number;
  totalBranches?: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  selectedModelName?: string;
  selectedModelColor?: string;
  onModelClick?: () => void;
  /** Chat mode (build vs discuss) */
  chatMode?: ChatMode;
  onChatModeChange?: (mode: ChatMode) => void;
  /** Prompt enhancement callbacks */
  onEnhancePrompt?: (enhanced: string) => void;
  enhancedPrompt?: string;
  isEnhancing?: boolean;
  /** Branch navigation */
  onRegenerate?: (messageId: string) => void;
  onBranchPrevious?: (messageId: string) => void;
  onBranchNext?: (messageId: string) => void;
  /** Project context for prompt enhancer */
  projectContext?: string;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  selectedModelName,
  selectedModelColor,
  onModelClick,
  chatMode = 'build',
  onChatModeChange,
  onEnhancePrompt,
  enhancedPrompt,
  isEnhancing,
  onRegenerate,
  onBranchPrevious,
  onBranchNext,
  projectContext,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When parent provides an enhanced prompt, replace the input
  useEffect(() => {
    if (enhancedPrompt) {
      setInput(enhancedPrompt);
      // Re-focus textarea after enhancement
      textareaRef.current?.focus();
    }
  }, [enhancedPrompt]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 4 * 24; // 4 rows * ~24px line-height
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  /** Handle enhanced prompt acceptance from PromptEnhancer popover */
  const handleEnhanceAccept = useCallback((enhanced: string) => {
    setInput(enhanced);
    // Also notify parent if callback provided
    onEnhancePrompt?.(enhanced);
    textareaRef.current?.focus();
  }, [onEnhancePrompt]);

  /** Handle prompt enhancer dismiss */
  const handleEnhanceDismiss = useCallback(() => {
    // No-op — just close the popover, keep original input
  }, []);

  /** Render assistant message content using streaming markdown utilities */
  const renderContent = useCallback((content: string, isAssistant: boolean) => {
    // For assistant messages, finalize markdown to close any unclosed blocks
    const processed = isAssistant ? finalizeMarkdown(content) : content;

    // Extract code blocks for syntax-highlighted rendering
    const codeBlocks = extractCodeBlocks(processed);

    if (codeBlocks.length === 0) {
      // No code blocks — render as plain text with basic markdown
      return <span>{processed}</span>;
    }

    // Build segments: text before/between/after code blocks + highlighted blocks
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    codeBlocks.forEach((block, i) => {
      // Text before this code block
      if (block.startIndex > lastEnd) {
        const textBefore = processed.slice(lastEnd, block.startIndex);
        if (textBefore.trim()) {
          segments.push(<span key={`text-${i}`}>{textBefore}</span>);
        }
      }

      // The code block itself
      segments.push(
        <div key={`code-${i}`} className="my-2 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between px-3 py-1 bg-[#0E0E0E] border-b border-[rgba(255,255,255,0.04)]">
            <span className="text-[10px] font-mono text-[#555] uppercase">{block.language}</span>
          </div>
          <SyntaxHighlighter
            language={block.language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', background: '#0E0E0E' }}
          >
            {block.code}
          </SyntaxHighlighter>
        </div>
      );

      lastEnd = block.endIndex;
    });

    // Text after the last code block
    if (lastEnd < processed.length) {
      const textAfter = processed.slice(lastEnd);
      if (textAfter.trim()) {
        segments.push(<span key="text-end">{textAfter}</span>);
      }
    }

    return <>{segments}</>;
  }, []);

  /** Legacy render for non-assistant messages (user/system) */
  const renderLegacyContent = useCallback((content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0]?.trim() || 'text';
        const code = lines.slice(1).join('\n');
        return (
          <div key={i} className="my-2 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)]">
            <SyntaxHighlighter
              language={lang}
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', background: '#0E0E0E' }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <pre className="text-[#FA4500] text-[10px] font-mono opacity-40 mb-4 leading-tight select-none">
{`    _    ____   ____ _   _ ____
   / \\  |  _ \\ / ___| | | / ___|
  / _ \\ | |_) | |  _| | | \\___ \\
 / ___ \\|  _ <| |_| | |_| |___) |
/_/   \\_\\_| \\_\\\\____|\\___/|____/`}
            </pre>
            <p className="text-[#666] text-sm font-mono">
              Describe what you want to build...
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[85%]">
              <div
                className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#FA4500] text-white font-mono'
                    : msg.role === 'system'
                    ? 'bg-[#1A1A1A] text-[#888] text-xs font-mono border border-[rgba(255,255,255,0.05)]'
                    : 'bg-[#F5F5F5] text-[#1A1A1A]'
                }`}
              >
                {msg.role === 'assistant'
                  ? renderContent(msg.content, true)
                  : renderLegacyContent(msg.content)
                }

                {/* File change indicators for assistant msgs */}
                {msg.fileChanges && msg.fileChanges.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.fileChanges.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-1.5 text-[11px] font-mono opacity-70"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Edited: {file}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BranchPicker — shown below assistant messages that have branches */}
              {msg.role === 'assistant' && (
                <BranchPicker
                  messageId={msg.id}
                  currentBranch={msg.currentBranch ?? 0}
                  totalBranches={msg.totalBranches ?? 1}
                  onPrevious={onBranchPrevious ?? (() => {})}
                  onNext={onBranchNext ?? (() => {})}
                  onRegenerate={onRegenerate ?? (() => {})}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt bar */}
      <div className="border-t border-[rgba(255,255,255,0.06)] bg-[#0E0E0E] p-3">
        <div className="flex items-end gap-2 bg-[#1A1A1A] rounded-xl border border-[rgba(255,255,255,0.08)] focus-within:border-[#FA4500] transition-colors px-3 py-2">
          {/* Model pill */}
          {selectedModelName && (
            <button
              onClick={onModelClick}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0E0E0E] text-[11px] font-mono text-[#888] hover:text-white transition-colors flex-shrink-0 mb-0.5"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedModelColor || '#FA4500' }}
              />
              {selectedModelName}
            </button>
          )}

          {/* Chat mode toggle — between model pill and textarea */}
          {onChatModeChange && (
            <ChatModeToggle
              mode={chatMode}
              onChange={onChatModeChange}
              disabled={isGenerating}
            />
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatMode === 'discuss' ? 'Ask a question or discuss ideas...' : 'Ask Argus to build something...'}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm font-mono placeholder:text-[#555] resize-none outline-none min-h-[24px] max-h-[96px]"
            disabled={isGenerating}
          />

          {/* Prompt enhancer sparkle — between textarea and send button */}
          <PromptEnhancer
            prompt={input}
            onAccept={handleEnhanceAccept}
            onDismiss={handleEnhanceDismiss}
            projectContext={projectContext}
            disabled={isGenerating || isEnhancing}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FA4500] hover:bg-[#E63F00] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed flex items-center justify-center transition-colors mb-0.5"
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="text-[10px] text-[#444] font-mono mt-1.5 text-center">
          {chatMode === 'discuss' ? 'Discussion mode — no code generation' : '\u2318 + Enter to send'}
        </div>
      </div>
    </div>
  );
}
