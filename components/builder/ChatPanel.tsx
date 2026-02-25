'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  fileChanges?: string[];
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  selectedModelName?: string;
  selectedModelColor?: string;
  onModelClick?: () => void;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  selectedModelName,
  selectedModelColor,
  onModelClick,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  /** Detect code blocks in message content */
  const renderContent = (content: string) => {
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
  };

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
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#FA4500] text-white font-mono'
                  : msg.role === 'system'
                  ? 'bg-[#1A1A1A] text-[#888] text-xs font-mono border border-[rgba(255,255,255,0.05)]'
                  : 'bg-[#F5F5F5] text-[#1A1A1A]'
              }`}
            >
              {renderContent(msg.content)}

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

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Argus to build something..."
            rows={1}
            className="flex-1 bg-transparent text-white text-sm font-mono placeholder:text-[#555] resize-none outline-none min-h-[24px] max-h-[96px]"
            disabled={isGenerating}
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
          ⌘ + Enter to send
        </div>
      </div>
    </div>
  );
}
