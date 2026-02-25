/**
 * Input validation utilities for Argus API routes.
 * Sanitizes and validates user-provided strings before using them in AI prompts,
 * database queries, or other sensitive operations.
 */

/**
 * Sanitize a string: strip HTML tags, trim whitespace, enforce max length.
 * Throws if the input is not a string or exceeds max length.
 */
export function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') {
    throw new Error('Expected string');
  }
  // Strip HTML/script tags
  const stripped = input.replace(/<[^>]*>/g, '').trim();
  if (stripped.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`);
  }
  return stripped;
}

/**
 * Validate and sanitize a string, returning null if input is null/undefined.
 * Useful for optional fields.
 */
export function sanitizeOptionalString(
  input: unknown,
  maxLength: number
): string | null {
  if (input === null || input === undefined || input === '') return null;
  return sanitizeString(input, maxLength);
}

/**
 * Allowlist of supported AI model IDs.
 * Update this list when adding new model integrations.
 */
export const ALLOWED_MODELS: ReadonlySet<string> = new Set([
  // Anthropic
  'claude-sonnet-4-5',
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-3-5',
  // OpenAI
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  // Google
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  // Meta / Groq
  'llama-3.3-70b',
  'llama-3.1-70b',
  // Deepseek
  'deepseek-r1',
  'deepseek-v3',
  // Mistral
  'mistral-large',
  // Alibaba
  'qwen-2.5-72b',
  // OpenRouter / custom
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'groq/openai/gpt-oss-120b',
  'cerebras/gpt-oss-120b',
]);

/**
 * Validate an AI model ID against the allowlist.
 * Returns the model string if valid, or the default model if not.
 */
export function validateModel(
  model: unknown,
  defaultModel = 'openai/gpt-oss-20b'
): string {
  if (typeof model !== 'string') return defaultModel;
  const normalized = model.trim();
  if (!ALLOWED_MODELS.has(normalized)) {
    console.warn(`[validation] Rejected unknown model: "${normalized}", using default`);
    return defaultModel;
  }
  return normalized;
}

/**
 * Validate a URL string (basic check — must start with http/https).
 */
export function validateUrl(input: unknown): string {
  if (typeof input !== 'string') throw new Error('URL must be a string');
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('Invalid URL: must start with http:// or https://');
  }
  // Prevent SSRF to localhost / private IPs
  const hostname = new URL(trimmed).hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('172.17.') ||
    hostname.startsWith('172.18.') ||
    hostname.startsWith('172.19.') ||
    hostname.startsWith('172.2') ||
    hostname.startsWith('172.30.') ||
    hostname.startsWith('172.31.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Invalid URL: internal/private addresses are not allowed');
  }
  return trimmed;
}

/**
 * Validate project name: string, 1–100 chars, no HTML.
 */
export function validateProjectName(input: unknown): string {
  const name = sanitizeString(input, 100);
  if (name.length < 1) throw new Error('Project name cannot be empty');
  return name;
}

/**
 * Validate project description: optional string, max 500 chars, no HTML.
 */
export function validateProjectDescription(input: unknown): string | null {
  return sanitizeOptionalString(input, 500);
}

/**
 * Validate an AI generation prompt: string, max 10,000 chars, strip HTML.
 */
export function validatePrompt(input: unknown): string {
  const prompt = sanitizeString(input, 10_000);
  if (prompt.length < 1) throw new Error('Prompt cannot be empty');
  return prompt;
}
