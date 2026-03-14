'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { EditorChatMessage, GenerationProgress, CodeApplicationState, ConversationContext } from '@/types/editor';

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
    <div className="flex-1 max-w-[400px] flex flex-col border-r border-gray-200 bg-white">
      {/* Scraped website info */}
      {conversationContext.scrapedWebsites.length > 0 && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
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
                  <a href={sourceURL} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-gray-700 truncate max-w-[250px] font-medium">
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
                  msg.type === 'user' ? 'bg-[#36322F] text-white ml-auto max-w-[80%]' :
                  msg.type === 'ai' ? 'bg-gray-100 text-gray-900 mr-auto max-w-[80%]' :
                  msg.type === 'system' ? 'bg-[#36322F] text-white text-sm' :
                  msg.type === 'command' ? 'bg-[#36322F] text-white font-mono text-sm' :
                  msg.type === 'error' ? 'bg-red-900 text-red-100 text-sm border border-red-700' :
                  'bg-[#36322F] text-white text-sm'
                }`}>
                  {msg.type === 'command' ? (
                    <div className="flex items-start gap-2">
                      <span className={`text-xs ${
                        msg.metadata?.commandType === 'input' ? 'text-blue-400' :
                        msg.metadata?.commandType === 'error' ? 'text-red-400' :
                        msg.metadata?.commandType === 'success' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {msg.metadata?.commandType === 'input' ? '$' : '>'}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap text-white">{msg.content}</span>
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
                  <div className="mt-3 inline-block bg-gray-100 rounded-xl p-3">
                    <div className="text-sm font-medium mb-2 text-gray-700">
                      {msg.content.includes('Applied') ? 'Files Updated:' : 'Generated Files:'}
                    </div>
                    <div className="flex flex-wrap items-start gap-1.5">
                      {msg.metadata.appliedFiles.map((filePath, fileIdx) => {
                        const fileName = filePath.split('/').pop() || filePath;
                        const ext = fileName.split('.').pop() || '';
                        const dotColor = ext === 'css' ? 'bg-blue-400' : (ext === 'jsx' || ext === 'js') ? 'bg-yellow-400' : ext === 'json' ? 'bg-green-400' : 'bg-gray-400';
                        return (
                          <div key={`applied-${fileIdx}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#36322F] text-white rounded-lg text-sm" style={{ animationDelay: `${fileIdx * 30}ms` }}>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">
                {codeApplicationState.stage === 'analyzing' && 'Analyzing code...'}
                {codeApplicationState.stage === 'installing' && 'Installing packages...'}
                {codeApplicationState.stage === 'applying' && 'Applying changes...'}
              </span>
            </div>
            {codeApplicationState.stage === 'installing' && codeApplicationState.packages && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {codeApplicationState.packages.map((pkg, i) => (
                  <span key={i} className={`px-2 py-0.5 text-xs rounded-full transition-all ${codeApplicationState.installedPackages?.includes(pkg) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {pkg}{codeApplicationState.installedPackages?.includes(pkg) && ' ✓'}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* File generation progress (inline during generation) */}
        {generationProgress.isGenerating && (
          <div className="inline-block bg-gray-100 rounded-lg p-3">
            <div className="text-sm font-medium mb-2 text-gray-700">{generationProgress.status}</div>
            <div className="flex flex-wrap items-start gap-1">
              {generationProgress.files.map((file, idx) => (
                <div key={`file-${idx}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#36322F] text-white rounded-lg text-xs" style={{ animationDelay: `${idx * 30}ms` }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {file.path.split('/').pop()}
                </div>
              ))}
              {generationProgress.currentFile && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#36322F]/70 text-white rounded-lg text-xs animate-pulse">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {generationProgress.currentFile.path.split('/').pop()}
                </div>
              )}
            </div>

            {generationProgress.streamedCode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 border-t border-gray-300 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-gray-600">AI Response Stream</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded max-h-32 overflow-y-auto scrollbar-hide">
                  <SyntaxHighlighter language="jsx" style={vscDarkPlus} customStyle={{ margin: 0, padding: '0.75rem', fontSize: '11px', lineHeight: '1.5', background: 'transparent', maxHeight: '8rem', overflow: 'hidden' }}>
                    {generationProgress.streamedCode.slice(-1000)}
                  </SyntaxHighlighter>
                  <span className="inline-block w-2 h-3 bg-orange-400 ml-3 mb-3 animate-pulse" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs text-gray-600 font-medium">{isGenerating ? 'Generating...' : 'System Ready'}</span>
          </div>
          <span className="text-xs text-gray-400">{selectedModelName}</span>
        </div>
      </div>

      {/* Chat input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 transition-colors"
            rows={1}
            disabled={isGenerating}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={onSendMessage}
            disabled={isGenerating || !chatInput.trim()}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
