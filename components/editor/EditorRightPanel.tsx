'use client';

import { useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiChevronDown, FiChevronRight } from '@/lib/icons';
import { BsFolderFill, BsFolder2Open } from '@/lib/icons';
import { SiJavascript, SiCss3, SiJson, SiReact } from '@/lib/icons';
import { FiFile } from '@/lib/icons';
import type { SandboxData, GenerationProgress, CodeApplicationState } from '@/types/editor';

interface EditorRightPanelProps {
  activeTab: 'generation' | 'preview';
  onTabChange: (tab: 'generation' | 'preview') => void;
  generationProgress: GenerationProgress;
  selectedFile: string | null;
  onSelectFile: (path: string | null) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  sandboxData: SandboxData | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  codeApplicationState: CodeApplicationState;
  urlScreenshot: string | null;
  isScreenshotLoaded: boolean;
  onScreenshotLoad: () => void;
  isCapturingScreenshot: boolean;
  isPreparingDesign: boolean;
  loading: boolean;
  screenshotError: string | null;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jsx' || ext === 'tsx') return <SiReact style={{ width: '14px', height: '14px' }} className="text-blue-400" />;
  if (ext === 'js' || ext === 'ts') return <SiJavascript style={{ width: '14px', height: '14px' }} className="text-yellow-400" />;
  if (ext === 'css') return <SiCss3 style={{ width: '14px', height: '14px' }} className="text-blue-500" />;
  if (ext === 'json') return <SiJson style={{ width: '14px', height: '14px' }} className="text-green-400" />;
  return <FiFile style={{ width: '14px', height: '14px' }} className="text-gray-400" />;
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'css';
  if (ext === 'json') return 'json';
  if (ext === 'html') return 'html';
  return 'jsx';
}

export default function EditorRightPanel({
  activeTab,
  onTabChange,
  generationProgress,
  selectedFile,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  sandboxData,
  iframeRef,
  codeApplicationState,
  urlScreenshot,
  isScreenshotLoaded,
  onScreenshotLoad,
  isCapturingScreenshot,
  isPreparingDesign,
  loading,
  screenshotError,
}: EditorRightPanelProps) {
  const codeDisplayRef = useRef<HTMLDivElement>(null);

  const renderGenerationTab = () => {
    if (!generationProgress.isGenerating && generationProgress.files.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-sm">Start chatting to create your first app</p>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex overflow-hidden">
        {/* File Explorer */}
        {!generationProgress.isEdit && (
          <div className="w-[250px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
            <div className="p-3 bg-gray-100 text-gray-900 flex items-center gap-2">
              <BsFolderFill style={{ width: '16px', height: '16px' }} />
              <span className="text-sm font-medium">Explorer</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
              <div className="text-sm">
                <div className="flex items-center gap-2 py-0.5 px-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700" onClick={() => onToggleFolder('app')}>
                  {expandedFolders.has('app') ? <FiChevronDown style={{ width: '16px', height: '16px' }} className="text-gray-600" /> : <FiChevronRight style={{ width: '16px', height: '16px' }} className="text-gray-600" />}
                  {expandedFolders.has('app') ? <BsFolder2Open style={{ width: '16px', height: '16px' }} className="text-blue-500" /> : <BsFolderFill style={{ width: '16px', height: '16px' }} className="text-blue-500" />}
                  <span className="font-medium text-gray-800">app</span>
                </div>
                {expandedFolders.has('app') && (
                  <div className="ml-6">
                    {(() => {
                      const fileTree: { [key: string]: Array<{ name: string; edited?: boolean }> } = {};
                      generationProgress.files.forEach(file => {
                        const parts = file.path.split('/');
                        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                        const fileName = parts[parts.length - 1];
                        if (!fileTree[dir]) fileTree[dir] = [];
                        fileTree[dir].push({ name: fileName, edited: file.edited || false });
                      });
                      return Object.entries(fileTree).map(([dir, files]) => (
                        <div key={dir} className="mb-1">
                          {dir && (
                            <div className="flex items-center gap-2 py-0.5 px-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700" onClick={() => onToggleFolder(dir)}>
                              {expandedFolders.has(dir) ? <FiChevronDown style={{ width: '16px', height: '16px' }} className="text-gray-600" /> : <FiChevronRight style={{ width: '16px', height: '16px' }} className="text-gray-600" />}
                              {expandedFolders.has(dir) ? <BsFolder2Open style={{ width: '16px', height: '16px' }} className="text-yellow-600" /> : <BsFolderFill style={{ width: '16px', height: '16px' }} className="text-yellow-600" />}
                              <span className="text-gray-700">{dir.split('/').pop()}</span>
                            </div>
                          )}
                          {(!dir || expandedFolders.has(dir)) && (
                            <div className={dir ? 'ml-8' : ''}>
                              {files.sort((a, b) => a.name.localeCompare(b.name)).map(fileInfo => {
                                const fullPath = dir ? `${dir}/${fileInfo.name}` : fileInfo.name;
                                const isSelected = selectedFile === fullPath;
                                return (
                                  <div key={fullPath} className={`flex items-center gap-2 py-0.5 px-3 rounded cursor-pointer transition-all ${isSelected ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => onSelectFile(fullPath)}>
                                    {getFileIcon(fileInfo.name)}
                                    <span className={`text-xs flex items-center gap-1 ${isSelected ? 'font-medium' : ''}`}>
                                      {fileInfo.name}
                                      {fileInfo.edited && <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-blue-400' : 'bg-orange-500 text-white'}`}>✓</span>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Code Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Thinking mode */}
          {generationProgress.isGenerating && (generationProgress.isThinking || generationProgress.thinkingText) && (
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-2 text-purple-600 font-medium">
                {generationProgress.isThinking ? (
                  <><div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />AI is thinking...</>
                ) : (
                  <><span>✓</span>Thought for {generationProgress.thinkingDuration || 0} seconds</>
                )}
              </div>
              {generationProgress.thinkingText && (
                <div className="bg-purple-950 border border-purple-700 rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-hide">
                  <pre className="text-xs font-mono text-purple-300 whitespace-pre-wrap">{generationProgress.thinkingText}</pre>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 rounded-lg p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide" ref={codeDisplayRef}>
              {selectedFile ? (
                <div className="bg-black border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(selectedFile)}
                      <span className="font-mono text-sm">{selectedFile}</span>
                    </div>
                    <button onClick={() => onSelectFile(null)} className="hover:bg-black/20 p-1 rounded transition-colors">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <SyntaxHighlighter language={getLanguage(selectedFile)} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', background: '#1e1e1e' }} showLineNumbers>
                    {generationProgress.files.find(f => f.path === selectedFile)?.content || '// File content will appear here'}
                  </SyntaxHighlighter>
                </div>
              ) : generationProgress.files.length === 0 && !generationProgress.currentFile ? (
                generationProgress.isThinking ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-4 relative">
                        <div className="absolute inset-0 border-4 border-gray-300 rounded-full" />
                        <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-spin border-t-transparent" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">AI is analyzing your request</h3>
                      <p className="text-gray-500 text-sm">{generationProgress.status || 'Preparing to generate code...'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-100 text-gray-900 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono text-sm">Streaming code...</span>
                    </div>
                    <SyntaxHighlighter language="jsx" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', background: '#1e1e1e' }} showLineNumbers>
                      {generationProgress.streamedCode || 'Starting code generation...'}
                    </SyntaxHighlighter>
                    <span className="inline-block w-2 h-4 bg-orange-400 ml-4 mb-4 animate-pulse" />
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {generationProgress.currentFile && (
                    <div className="bg-black border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-[#36322F] text-white flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-mono text-sm">{generationProgress.currentFile.path}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${generationProgress.currentFile.type === 'css' ? 'bg-blue-600' : generationProgress.currentFile.type === 'javascript' ? 'bg-yellow-600' : generationProgress.currentFile.type === 'json' ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
                          {generationProgress.currentFile.type === 'javascript' ? 'JSX' : generationProgress.currentFile.type.toUpperCase()}
                        </span>
                      </div>
                      <SyntaxHighlighter language={getLanguage(generationProgress.currentFile.path)} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.75rem', background: '#1e1e1e' }} showLineNumbers>
                        {generationProgress.currentFile.content}
                      </SyntaxHighlighter>
                      <span className="inline-block w-2 h-3 bg-orange-400 ml-4 mb-4 animate-pulse" />
                    </div>
                  )}
                  {generationProgress.files.map((file, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="font-mono text-sm">{file.path}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded ${file.type === 'css' ? 'bg-blue-600' : file.type === 'javascript' ? 'bg-yellow-600' : file.type === 'json' ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
                          {file.type === 'javascript' ? 'JSX' : file.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto scrollbar-hide">
                        <SyntaxHighlighter language={getLanguage(file.path)} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.75rem', background: '#1e1e1e' }} showLineNumbers wrapLongLines>
                          {file.content}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {generationProgress.components.length > 0 && (
            <div className="mx-6 mb-4">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300" style={{ width: `${(generationProgress.currentComponent / Math.max(generationProgress.components.length, 1)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreviewTab = () => {
    const isInitialGeneration = !sandboxData?.url && (urlScreenshot || isCapturingScreenshot || isPreparingDesign);
    const shouldShowLoadingOverlay = isInitialGeneration && (loading || generationProgress.isGenerating || isPreparingDesign || isCapturingScreenshot);

    if (isInitialGeneration) {
      return (
        <div className="relative w-full h-full bg-gray-900">
          {urlScreenshot && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={urlScreenshot} alt="Website preview" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isScreenshotLoaded ? 1 : 0 }} onLoad={onScreenshotLoad} loading="eager" />
          )}
          {shouldShowLoadingOverlay && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="text-center max-w-md">
                <div className="mb-6 space-y-3">
                  <div className="h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded animate-pulse" style={{ animationDuration: '1.5s' }} />
                  <div className="h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded animate-pulse w-4/5 mx-auto" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                  <div className="h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded animate-pulse w-3/5 mx-auto" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }} />
                </div>
                <p className="text-white text-lg font-medium">
                  {isCapturingScreenshot ? 'Analyzing website...' : isPreparingDesign ? 'Preparing design...' : generationProgress.isGenerating ? 'Generating code...' : 'Loading...'}
                </p>
                <p className="text-white/60 text-sm mt-2">
                  {isCapturingScreenshot ? 'Taking a screenshot of the site' : isPreparingDesign ? 'Understanding the layout and structure' : generationProgress.isGenerating ? 'Writing React components' : 'Please wait...'}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (sandboxData?.url) {
      return (
        <div className="relative w-full h-full">
          <iframe ref={iframeRef} src={sandboxData.url} className="w-full h-full border-none" title="Live Preview" allow="clipboard-write" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
          {codeApplicationState.stage && codeApplicationState.stage !== 'complete' && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center max-w-md">
                <svg className="w-12 h-12 mx-auto animate-spin text-gray-600 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {codeApplicationState.stage === 'analyzing' && 'Analyzing code...'}
                  {codeApplicationState.stage === 'installing' && 'Installing packages...'}
                  {codeApplicationState.stage === 'applying' && 'Applying changes...'}
                </h3>
                {codeApplicationState.stage === 'installing' && codeApplicationState.packages && (
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {codeApplicationState.packages.map((pkg, i) => (
                      <span key={i} className={`px-2 py-1 text-xs rounded-full ${codeApplicationState.installedPackages?.includes(pkg) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {pkg}{codeApplicationState.installedPackages?.includes(pkg) && ' ✓'}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500">{codeApplicationState.stage === 'analyzing' ? 'Parsing generated code...' : codeApplicationState.stage === 'installing' ? 'Installing npm packages...' : 'Writing files to sandbox...'}</p>
              </div>
            </div>
          )}
          {generationProgress.isGenerating && generationProgress.isEdit && !codeApplicationState.stage && (
            <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-medium">Generating code...</span>
            </div>
          )}
          <button
            onClick={() => { if (iframeRef.current && sandboxData?.url) iframeRef.current.src = `${sandboxData.url}?t=${Date.now()}&manual=true`; }}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition-all hover:scale-105"
            title="Refresh sandbox"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600">
        {screenshotError ? (
          <div className="text-center"><p className="mb-2">Failed to capture screenshot</p><p className="text-sm text-gray-500">{screenshotError}</p></div>
        ) : sandboxData ? (
          <div className="text-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm">Loading preview...</p></div>
        ) : (
          <p className="text-sm">Start chatting to create your first app</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="px-3 pt-3 pb-3 bg-white border-b border-gray-200 flex justify-between items-center">
        <div className="inline-flex bg-gray-100 border border-gray-200 rounded-md p-0.5">
          <button onClick={() => onTabChange('generation')} className={`px-3 py-1 rounded transition-all text-xs font-medium ${activeTab === 'generation' ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              <span>Code</span>
            </div>
          </button>
          <button onClick={() => onTabChange('preview')} className={`px-3 py-1 rounded transition-all text-xs font-medium ${activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span>View</span>
            </div>
          </button>
        </div>
        <div className="flex gap-2 items-center">
          {activeTab === 'generation' && !generationProgress.isEdit && generationProgress.files.length > 0 && (
            <span className="text-gray-500 text-xs font-medium">{generationProgress.files.length} files generated</span>
          )}
          {activeTab === 'generation' && generationProgress.isGenerating && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {generationProgress.isEdit ? 'Editing code' : 'Live generation'}
            </div>
          )}
          {sandboxData && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />Sandbox active
            </div>
          )}
          {sandboxData?.url && (
            <a href={sandboxData.url} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'generation' ? renderGenerationTab() : renderPreviewTab()}
      </div>
    </div>
  );
}
