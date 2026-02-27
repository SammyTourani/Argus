/**
 * Chat Mode System for Argus AI Builder
 *
 * Two modes:
 *   BUILD   — generates code, creates/modifies files (default)
 *   DISCUSS — structured advice without code generation
 */

export type ChatMode = 'build' | 'discuss';

export interface ChatModeConfig {
  id: ChatMode;
  label: string;
  description: string;
  icon: string; // lucide icon name
  systemPromptModifier: string;
}

export const CHAT_MODES: Record<ChatMode, ChatModeConfig> = {
  build: {
    id: 'build',
    label: 'Build',
    description: 'Generate code, create files, and modify your project',
    icon: 'Code2',
    systemPromptModifier: '',
  },
  discuss: {
    id: 'discuss',
    label: 'Discuss',
    description: 'Plan, discuss architecture, or get advice without code generation',
    icon: 'MessageCircle',
    systemPromptModifier: `MODE: DISCUSSION ONLY
You are in discussion mode. The user wants to plan, discuss architecture, or get advice.

CRITICAL RULES FOR THIS MODE:
1. DO NOT generate any code or files
2. DO NOT output <file> tags
3. Instead, provide:
   - Clear explanations of trade-offs
   - Architecture recommendations
   - Step-by-step implementation plans
   - Best practice suggestions
   - Technology comparisons when relevant
4. Use markdown formatting for readability
5. Be concise but thorough
6. If the user's question would benefit from seeing code, suggest they switch to Build mode`,
  },
};

/**
 * Get the system prompt modifier for a given chat mode.
 * Returns an empty string for Build mode (default behavior).
 */
export function getChatModePrompt(mode: ChatMode): string {
  return CHAT_MODES[mode]?.systemPromptModifier ?? '';
}
