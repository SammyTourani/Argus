/**
 * Tests for lib/ai/user-key-resolver.ts
 *
 * Validates that getUserApiKey correctly:
 * - Returns decrypted key when user has an active key for the provider
 * - Returns null when no key exists
 * - Returns null on DB error
 * - Maps model prefixes to correct providers
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock supabase admin client
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEqStatus = vi.fn(() => ({ order: mockOrder }));
const mockEqProvider = vi.fn(() => ({ eq: mockEqStatus }));
const mockEqUserId = vi.fn(() => ({ eq: mockEqProvider }));
const mockSelect = vi.fn(() => ({ eq: mockEqUserId }));
const mockUpdateEq = vi.fn(() => ({ then: (cb: (v: unknown) => void) => cb({}) }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockFrom = vi.fn((table: string) => {
  if (table === 'user_api_keys') {
    return { select: mockSelect, update: mockUpdate };
  }
  return { select: mockSelect, update: mockUpdate };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock crypto decrypt
vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn((hex: string) => `decrypted-${hex}`),
}));

import { getUserApiKey } from '@/lib/ai/user-key-resolver';

describe('getUserApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns decrypted key when user has active key', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'key-1', encrypted_key: 'abc123hex' },
      error: null,
    });

    const result = await getUserApiKey('user-1', 'anthropic/claude-sonnet-4-20250514');
    expect(result).toBe('decrypted-abc123hex');
    // Verify provider was resolved correctly
    expect(mockEqProvider).toHaveBeenCalledWith('provider', 'anthropic');
  });

  test('returns null when no key exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getUserApiKey('user-1', 'openai/gpt-4o');
    expect(result).toBeNull();
  });

  test('returns null on DB error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: new Error('DB connection failed'),
    });

    const result = await getUserApiKey('user-1', 'google/gemini-2.5-pro');
    expect(result).toBeNull();
  });

  test('maps model prefixes to correct providers', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await getUserApiKey('user-1', 'anthropic/claude-sonnet-4-20250514');
    expect(mockEqProvider).toHaveBeenCalledWith('provider', 'anthropic');

    vi.clearAllMocks();
    await getUserApiKey('user-1', 'openai/gpt-4o');
    expect(mockEqProvider).toHaveBeenCalledWith('provider', 'openai');

    vi.clearAllMocks();
    await getUserApiKey('user-1', 'google/gemini-2.5-pro');
    expect(mockEqProvider).toHaveBeenCalledWith('provider', 'google');

    vi.clearAllMocks();
    await getUserApiKey('user-1', 'llama-3.3-70b-versatile');
    expect(mockEqProvider).toHaveBeenCalledWith('provider', 'groq');
  });
});
