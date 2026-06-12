/**
 * Tests for the model-selection side of the AI fallback chain —
 * lib/ai/fallback-chain.ts.
 *
 * The existing fallback-chain.test.ts covers streamWithFallback's
 * retry/failover behaviour. This file covers the pure selection logic:
 *   - getFallbackChainForContext: which models a request is allowed to use
 *     given the user's tier and whether they still have paid credits.
 *   - the network-error (no HTTP status) retry classification, which is
 *     exercised here via streamWithFallback's observable retry count.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getFallbackChainForContext,
  streamWithFallback,
  DEFAULT_FALLBACK_CHAIN,
  type FallbackConfig,
} from '@/lib/ai/fallback-chain';
import type { SubscriptionTier } from '@/lib/subscription/gate';

const PAID_TIERS: SubscriptionTier[] = ['pro', 'team', 'enterprise'];

describe('getFallbackChainForContext', () => {
  it('uses the premium default chain for any tier that still has credits', () => {
    for (const tier of ['free', ...PAID_TIERS] as SubscriptionTier[]) {
      const chain = getFallbackChainForContext(tier, true);
      // Returns the shared DEFAULT_FALLBACK_CHAIN reference when credits remain.
      expect(chain).toBe(DEFAULT_FALLBACK_CHAIN);
      expect(chain.primary).toBe('anthropic/claude-sonnet-4-6');
      expect(chain.fallbacks).toEqual(['openai/gpt-4o', 'google/gemini-2.5-flash']);
    }
  });

  it('free tier with no credits drops to the free-after-depletion chain (no paid models)', () => {
    const chain = getFallbackChainForContext('free', false);
    expect(chain.primary).toBe('llama-3.3-70b');
    expect(chain.fallbacks).toEqual(['qwen-2.5-72b']);

    // Critically: a depleted free user must never be routed to a paid provider.
    const allModels = [chain.primary, ...chain.fallbacks];
    for (const model of allModels) {
      expect(model.startsWith('anthropic/')).toBe(false);
      expect(model.startsWith('openai/')).toBe(false);
    }
  });

  it('paid tiers with no credits keep gemini-flash primary then the free models', () => {
    for (const tier of PAID_TIERS) {
      const chain = getFallbackChainForContext(tier, false);
      expect(chain.primary).toBe('gemini-2.5-flash');
      expect(chain.fallbacks).toEqual(['llama-3.3-70b', 'qwen-2.5-72b']);
      // Paid-but-depleted still must not fall back to a metered Claude/GPT model.
      const allModels = [chain.primary, ...chain.fallbacks];
      expect(allModels.some((m) => m.startsWith('anthropic/') || m.startsWith('openai/'))).toBe(
        false,
      );
    }
  });

  it('every produced chain has sane retry settings', () => {
    const cases: Array<[SubscriptionTier, boolean]> = [
      ['free', true],
      ['free', false],
      ['pro', false],
      ['enterprise', false],
    ];
    for (const [tier, hasCredits] of cases) {
      const chain = getFallbackChainForContext(tier, hasCredits);
      expect(chain.maxRetries).toBeGreaterThanOrEqual(0);
      expect(chain.retryDelayMs).toBeGreaterThanOrEqual(0);
      expect(chain.fallbacks.length).toBeGreaterThan(0);
    }
  });
});

// ── Retry classification for status-less (network) errors ───────────────────
// getStatusCode/isRetryable are not exported, so we assert their behaviour
// through streamWithFallback's observable retry count. retryDelayMs is 0 so the
// tests stay fast.

const fastConfig: FallbackConfig = {
  primary: 'anthropic/claude-sonnet-4-6',
  fallbacks: ['openai/gpt-4o'],
  maxRetries: 1,
  retryDelayMs: 0,
};

describe('streamWithFallback — network-error retry classification', () => {
  it('retries transient network errors that carry no HTTP status', async () => {
    const mockStream = new ReadableStream();
    const buildStreamFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed: ECONNRESET'))
      .mockResolvedValue(mockStream);

    const result = await streamWithFallback(fastConfig, buildStreamFn);

    // Same model, recovered on the retry — no fallback needed.
    expect(result.usedModel).toBe('anthropic/claude-sonnet-4-6');
    expect(result.stream).toBe(mockStream);
    expect(buildStreamFn).toHaveBeenCalledTimes(2);
  });

  it('retries timeout/abort errors per model before moving to the fallback', async () => {
    const buildStreamFn = vi.fn().mockRejectedValue(new Error('request timeout, socket hang up'));

    await expect(streamWithFallback(fastConfig, buildStreamFn)).rejects.toThrow('timeout');

    // 2 models x (1 initial + 1 retry) because the message looks transient.
    expect(buildStreamFn).toHaveBeenCalledTimes(4);
  });

  it('does NOT retry an opaque error with no status and no transient keywords', async () => {
    const buildStreamFn = vi.fn().mockRejectedValue(new Error('totally unexpected failure'));

    await expect(streamWithFallback(fastConfig, buildStreamFn)).rejects.toThrow(
      'totally unexpected failure',
    );

    // 2 models x 1 attempt each — non-transient errors skip retries but still
    // try the next model in the chain.
    expect(buildStreamFn).toHaveBeenCalledTimes(2);
  });

  it('honours statusCode (not just status) when classifying retryability', async () => {
    const mockStream = new ReadableStream();
    const err = new Error('rate limited') as Error & { statusCode: number };
    err.statusCode = 429;
    const buildStreamFn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue(mockStream);

    const result = await streamWithFallback(fastConfig, buildStreamFn);

    expect(result.usedModel).toBe('anthropic/claude-sonnet-4-6');
    expect(buildStreamFn).toHaveBeenCalledTimes(2);
  });
});
