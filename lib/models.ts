/**
 * Central AI model registry — single source of truth for all model metadata.
 * Import from here instead of hardcoding model lists in components.
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: string[];
  costPer1k: number;
  color: string;
  badge: string | null;
  badgeColor: string | null;
}

/** All models available in Argus, ordered by recommendation priority */
export const MODELS: AIModel[] = [
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    description: 'Best overall — sharp reasoning, clean code output',
    tags: ['Frontend', 'Full-stack', 'Logic'],
    costPer1k: 0.003,
    color: '#CC785C',
    badge: 'Most Popular',
    badgeColor: 'bg-orange-500',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    description: 'Maximum intelligence for complex architectures and systems',
    tags: ['Architecture', 'Complex apps', 'Reasoning'],
    costPer1k: 0.015,
    color: '#CC785C',
    badge: 'Pro',
    badgeColor: 'bg-violet-500',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Excellent at structured UI generation and API design',
    tags: ['UI', 'APIs', 'Integration'],
    costPer1k: 0.005,
    color: '#10A37F',
    badge: null,
    badgeColor: null,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Ultra-fast iteration. Best for quick prototypes and MVPs',
    tags: ['Speed', 'Prototypes', 'Iteration'],
    costPer1k: 0.001,
    color: '#4285F4',
    badge: 'Fastest',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    description: 'Free on all plans. Solid for standard web apps',
    tags: ['Free', 'Standard', 'Open source'],
    costPer1k: 0,
    color: '#7C3AED',
    badge: 'Free',
    badgeColor: 'bg-emerald-500',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    description: 'Chain-of-thought reasoning. Best for complex logic and algorithms',
    tags: ['Logic', 'Algorithms', 'Backend'],
    costPer1k: 0.002,
    color: '#0EA5E9',
    badge: null,
    badgeColor: null,
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'European AI, strong at multilingual and enterprise features',
    tags: ['Enterprise', 'Multilingual', 'EU'],
    costPer1k: 0.002,
    color: '#FF6B35',
    badge: null,
    badgeColor: null,
  },
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    provider: 'Alibaba',
    description: 'Exceptional code generation and debugging performance',
    tags: ['Code gen', 'Debug', 'Performance'],
    costPer1k: 0.001,
    color: '#FF6900',
    badge: null,
    badgeColor: null,
  },
];

/** Convenience: array of just the canonical model IDs */
export const MODEL_IDS = MODELS.map((m) => m.id);

export const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';

export function getModel(id: string): AIModel | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getDefaultModel(): AIModel {
  return MODELS[0];
}
