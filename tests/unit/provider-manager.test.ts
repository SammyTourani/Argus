/**
 * Tests for AI Provider Manager — lib/ai/provider-manager.ts
 *
 * Validates model ID parsing, provider selection, and prefix stripping.
 * Uses mocked AI SDK providers to avoid real API calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all AI SDK provider factories before importing provider-manager
vi.mock('@ai-sdk/groq', () => ({
  createGroq: vi.fn(() => {
    const fn = (model: string) => ({ provider: 'groq', model });
    fn._provider = 'groq';
    return fn;
  }),
}));
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => {
    const fn = (model: string) => ({ provider: 'anthropic', model });
    fn._provider = 'anthropic';
    return fn;
  }),
}));
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => {
    const fn = (model: string) => ({ provider: 'openai', model });
    fn._provider = 'openai';
    return fn;
  }),
}));
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => {
    const fn = (model: string) => ({ provider: 'google', model });
    fn._provider = 'google';
    return fn;
  }),
}));

// Mock app config to avoid loading real config
vi.mock('@/config/app.config', () => ({
  appConfig: {
    ai: {
      modelApiConfig: {},
    },
  },
}));

import { getProviderForModel } from '@/lib/ai/provider-manager';

describe('Provider Manager', () => {
  it('resolves anthropic/ prefix to Anthropic provider', () => {
    const result = getProviderForModel('anthropic/claude-sonnet-4-6');
    expect(result.actualModel).toBe('claude-sonnet-4-6');
    expect(result.client).toBeDefined();
  });

  it('resolves openai/ prefix to OpenAI provider', () => {
    const result = getProviderForModel('openai/gpt-4o');
    expect(result.actualModel).toBe('gpt-4o');
    expect(result.client).toBeDefined();
  });

  it('resolves google/ prefix to Google provider', () => {
    const result = getProviderForModel('google/gemini-2.5-flash');
    expect(result.actualModel).toBe('gemini-2.5-flash');
    expect(result.client).toBeDefined();
  });

  it('resolves Kimi model to Groq provider', () => {
    const result = getProviderForModel('moonshotai/kimi-k2-instruct-0905');
    expect(result.actualModel).toBe('moonshotai/kimi-k2-instruct-0905');
    expect(result.client).toBeDefined();
  });

  it('defaults unknown models to Groq provider', () => {
    const result = getProviderForModel('some-random-model');
    expect(result.actualModel).toBe('some-random-model');
    expect(result.client).toBeDefined();
  });

  it('strips provider prefix from model IDs', () => {
    expect(getProviderForModel('anthropic/claude-3-haiku').actualModel).toBe('claude-3-haiku');
    expect(getProviderForModel('openai/gpt-4-turbo').actualModel).toBe('gpt-4-turbo');
    expect(getProviderForModel('google/gemini-pro').actualModel).toBe('gemini-pro');
  });
});
