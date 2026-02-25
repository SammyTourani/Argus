/**
 * Central AI model registry — single source of truth for all model metadata.
 * Import from here instead of hardcoding model lists in components.
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tag: string;
  costPer1k: number;
  color: string;
}

/** All models available in Argus, ordered by recommendation priority */
export const MODELS: AIModel[] = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', tag: 'Best overall', costPer1k: 0.003, color: '#CC785C' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Best reasoning', costPer1k: 0.005, color: '#10A37F' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', tag: 'Fastest', costPer1k: 0.001, color: '#4285F4' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Groq', tag: 'Free tier', costPer1k: 0, color: '#7C3AED' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Best for logic', costPer1k: 0.002, color: '#0EA5E9' },
];

export const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';

export function getModel(id: string): AIModel | undefined {
  return MODELS.find(m => m.id === id);
}

export function getDefaultModel(): AIModel {
  return MODELS[0];
}
