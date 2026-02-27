/**
 * Tests for token estimation — lib/ai/token-counter.ts
 *
 * Validates the character-based heuristic token counter: edge cases,
 * content-type detection, and budget checking.
 */

import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  estimateFileTokens,
  fitsInBudget,
  truncateToFit,
} from '@/lib/ai/token-counter';

describe('Token Counter', () => {
  // ── Edge cases ─────────────────────────────────────────────────────────

  it('empty string → 0 tokens', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('null-ish input → 0 tokens', () => {
    // The function guards for falsy input
    expect(estimateTokens(undefined as unknown as string)).toBe(0);
  });

  // ── Prose estimation ───────────────────────────────────────────────────

  it('estimates prose at ~4 chars per token', () => {
    const prose = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
    const tokens = estimateTokens(prose);
    // 450 chars / 4 ≈ 113 tokens (rounded up)
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(prose.length); // always fewer tokens than chars
  });

  // ── Code estimation ────────────────────────────────────────────────────

  it('estimates code at ~3.5 chars per token', () => {
    const code = [
      'import React from "react";',
      'export default function App() {',
      '  const [count, setCount] = React.useState(0);',
      '  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;',
      '}',
    ].join('\n');

    const tokens = estimateTokens(code);
    expect(tokens).toBeGreaterThan(0);
    // Code ratio is 3.5, so tokens should be > prose-based estimate
    const proseEstimate = Math.ceil(code.length / 4);
    expect(tokens).toBeGreaterThanOrEqual(proseEstimate);
  });

  // ── File-path-based estimation ─────────────────────────────────────────

  it('uses JSON ratio for .json files', () => {
    const json = '{"key": "value", "count": 42}';
    const fileTokens = estimateFileTokens(json, 'config.json');
    // JSON ratio is 3, so tokens = ceil(29/3) = 10
    expect(fileTokens).toBe(Math.ceil(json.length / 3));
  });

  it('uses code ratio for .ts files', () => {
    const code = 'const x = 42;';
    const fileTokens = estimateFileTokens(code, 'index.ts');
    expect(fileTokens).toBe(Math.ceil(code.length / 3.5));
  });

  // ── Budget checking ────────────────────────────────────────────────────

  it('short text fits in large budget', () => {
    expect(fitsInBudget('hello', 1000)).toBe(true);
  });

  it('long text does not fit in tiny budget', () => {
    const longText = 'a'.repeat(10_000);
    expect(fitsInBudget(longText, 10)).toBe(false);
  });

  // ── Truncation ─────────────────────────────────────────────────────────

  it('returns content unchanged when within budget', () => {
    const short = 'Hello, world!';
    expect(truncateToFit(short, 1000)).toBe(short);
  });

  it('truncates long content with marker', () => {
    const long = 'a\n'.repeat(5000);
    const truncated = truncateToFit(long, 50);
    expect(truncated.length).toBeLessThan(long.length);
    expect(truncated).toContain('truncated');
  });

  it('empty string truncation returns empty', () => {
    expect(truncateToFit('', 100)).toBe('');
  });
});
