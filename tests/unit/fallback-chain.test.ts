/**
 * Tests for AI model fallback chain — lib/ai/fallback-chain.ts
 *
 * Validates the retry and fallback logic: primary success, 429 fallback,
 * all-fail scenario, and non-retryable auth errors.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  streamWithFallback,
  DEFAULT_FALLBACK_CHAIN,
  type FallbackConfig,
} from '@/lib/ai/fallback-chain';

// Minimal config with no delay so tests are fast
const fastConfig: FallbackConfig = {
  primary: 'anthropic/claude-sonnet-4-6',
  fallbacks: ['openai/gpt-4o', 'google/gemini-2.5-flash'],
  maxRetries: 1,
  retryDelayMs: 0,
};

function makeError(status: number, message = 'error'): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

describe('AI Fallback Chain', () => {
  it('returns primary model stream when it succeeds', async () => {
    const mockStream = new ReadableStream();
    const buildStreamFn = vi.fn().mockResolvedValue(mockStream);

    const result = await streamWithFallback(fastConfig, buildStreamFn);

    expect(result.usedModel).toBe('anthropic/claude-sonnet-4-6');
    expect(result.stream).toBe(mockStream);
    expect(buildStreamFn).toHaveBeenCalledTimes(1);
  });

  it('falls back to secondary on 429 rate limit', async () => {
    const mockStream = new ReadableStream();
    const buildStreamFn = vi.fn()
      .mockRejectedValueOnce(makeError(429, 'Rate limited'))
      .mockRejectedValueOnce(makeError(429, 'Rate limited')) // retry
      .mockResolvedValue(mockStream);

    const onFallback = vi.fn();
    const result = await streamWithFallback(fastConfig, buildStreamFn, onFallback);

    expect(result.usedModel).toBe('openai/gpt-4o');
    expect(onFallback).toHaveBeenCalledWith(
      'anthropic/claude-sonnet-4-6',
      'openai/gpt-4o',
      expect.any(Error),
    );
  });

  it('skips retries on 401 but still tries fallback models', async () => {
    const buildStreamFn = vi.fn().mockRejectedValue(makeError(401, 'Unauthorized'));

    await expect(
      streamWithFallback(fastConfig, buildStreamFn),
    ).rejects.toThrow('Unauthorized');

    // 3 models x 1 attempt each (no retries for auth errors)
    expect(buildStreamFn).toHaveBeenCalledTimes(3);
  });

  it('skips retries on 403 but still tries fallback models', async () => {
    const buildStreamFn = vi.fn().mockRejectedValue(makeError(403, 'Forbidden'));

    await expect(
      streamWithFallback(fastConfig, buildStreamFn),
    ).rejects.toThrow('Forbidden');

    // 3 models x 1 attempt each (no retries for auth errors)
    expect(buildStreamFn).toHaveBeenCalledTimes(3);
  });

  it('falls back to working model on 401 from first provider', async () => {
    const mockStream = new ReadableStream();
    const buildStreamFn = vi.fn()
      .mockRejectedValueOnce(makeError(401, 'Unauthorized'))
      .mockResolvedValueOnce(mockStream);

    const result = await streamWithFallback(fastConfig, buildStreamFn);

    expect(result.usedModel).toBe('openai/gpt-4o');
    expect(buildStreamFn).toHaveBeenCalledTimes(2);
  });

  it('throws after all models fail', async () => {
    const buildStreamFn = vi.fn().mockRejectedValue(makeError(500, 'Server error'));

    await expect(
      streamWithFallback(fastConfig, buildStreamFn),
    ).rejects.toThrow('Server error');

    // 3 models x (1 initial + 1 retry) = 6 attempts
    expect(buildStreamFn).toHaveBeenCalledTimes(6);
  });

  it('default config uses Claude Sonnet as primary', () => {
    expect(DEFAULT_FALLBACK_CHAIN.primary).toBe('anthropic/claude-sonnet-4-6');
    expect(DEFAULT_FALLBACK_CHAIN.fallbacks).toContain('openai/gpt-4o');
    expect(DEFAULT_FALLBACK_CHAIN.fallbacks).toContain('google/gemini-2.5-flash');
  });
});
