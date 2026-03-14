/**
 * Type definitions for the Argus editor (ported from Open Lovable).
 * Used by EditorPage, EditorLeftPanel, EditorRightPanel.
 */

export interface SandboxData {
  sandboxId: string;
  url: string;
  success?: boolean;
  structure?: any;
  [key: string]: any;
}

export interface EditorChatMessage {
  content: string;
  type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
  timestamp: Date;
  metadata?: {
    scrapedUrl?: string;
    scrapedContent?: any;
    generatedCode?: string;
    appliedFiles?: string[];
    commandType?: 'input' | 'output' | 'error' | 'success';
    brandingData?: any;
    sourceUrl?: string;
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: string;
  completed: boolean;
  edited?: boolean;
}

export interface GenerationProgress {
  isGenerating: boolean;
  status: string;
  components: Array<{ name: string; path: string; completed: boolean }>;
  currentComponent: number;
  streamedCode: string;
  isStreaming: boolean;
  isThinking: boolean;
  thinkingText?: string;
  thinkingDuration?: number;
  currentFile?: { path: string; content: string; type: string };
  files: GeneratedFile[];
  lastProcessedPosition: number;
  isEdit?: boolean;
}

export interface CodeApplicationState {
  stage: 'analyzing' | 'installing' | 'applying' | 'complete' | null;
  packages?: string[];
  installedPackages?: string[];
  filesGenerated?: string[];
  message?: string;
}

export interface ConversationContext {
  scrapedWebsites: Array<{ url: string; content: any; timestamp: Date }>;
  generatedComponents: Array<{ name: string; path: string; content: string }>;
  appliedCode: Array<{ files: string[]; timestamp: Date }>;
  currentProject: string;
  lastGeneratedCode?: string;
}

export const INITIAL_GENERATION_PROGRESS: GenerationProgress = {
  isGenerating: false,
  status: '',
  components: [],
  currentComponent: 0,
  streamedCode: '',
  isStreaming: false,
  isThinking: false,
  files: [],
  lastProcessedPosition: 0,
};

export const INITIAL_CONVERSATION_CONTEXT: ConversationContext = {
  scrapedWebsites: [],
  generatedComponents: [],
  appliedCode: [],
  currentProject: '',
  lastGeneratedCode: undefined,
};

/** Editor config constants (ported from open-lovable/config/app.config.ts) */
export const EDITOR_CONFIG = {
  sandbox: {
    devServerStartupDelay: 7000,
    refreshDelay: 2000,
    packageInstallRefreshDelay: 5000,
  },
  ai: {
    maxTokens: 8000,
    truncationRecoveryMaxTokens: 4000,
  },
  ui: {
    maxChatMessages: 100,
    maxRecentMessagesContext: 20,
    animationDuration: 200,
  },
} as const;
