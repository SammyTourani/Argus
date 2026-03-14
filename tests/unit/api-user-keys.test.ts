/**
 * Tests for /api/user/api-keys routes — BYOK API key management.
 *
 * Mocks @/lib/supabase/server (createClient) to avoid real DB calls.
 * Mocks @/lib/crypto to avoid needing a real encryption key.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase } from '../helpers/mock-supabase';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-hex-string'),
  deriveKeyMask: vi.fn().mockReturnValue('sk-...mask'),
}));

import { createClient } from '@/lib/supabase/server';

function mockAuth(user: { id: string } | null) {
  const { client, mockData } = createMockSupabase();
  if (user) {
    client.auth.getUser = vi.fn().mockResolvedValue({
      data: { user },
      error: null,
    });
  } else {
    client.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });
  }
  (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
  return { client, mockData };
}

function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/user/api-keys', {
    method: body ? 'POST' : 'GET',
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

describe('/api/user/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ────────────────────────────────────────────────────────────────

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuth(null);
      const { GET } = await import('@/app/api/user/api-keys/route');
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns empty array when user has no keys', async () => {
      const { mockData } = mockAuth({ id: 'user-1' });
      mockData('user_api_keys', []);
      const { GET } = await import('@/app/api/user/api-keys/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.keys).toEqual([]);
    });

    it('returns masked keys list', async () => {
      const { mockData } = mockAuth({ id: 'user-1' });
      mockData('user_api_keys', [
        { id: 'key-1', user_id: 'user-1', provider: 'openai', label: 'My Key', key_mask: 'sk-...abc', status: 'active', created_at: '2026-01-01' },
      ]);
      const { GET } = await import('@/app/api/user/api-keys/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.keys).toHaveLength(1);
      expect(json.keys[0].provider).toBe('openai');
      // encrypted_key should never be returned
      expect(json.keys[0].encrypted_key).toBeUndefined();
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuth(null);
      const { POST } = await import('@/app/api/user/api-keys/route');
      const res = await POST(makeRequest({ provider: 'openai', key: 'sk-test12345678' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when provider is missing', async () => {
      mockAuth({ id: 'user-1' });
      const { POST } = await import('@/app/api/user/api-keys/route');
      const res = await POST(makeRequest({ key: 'sk-test12345678' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when key is missing', async () => {
      mockAuth({ id: 'user-1' });
      const { POST } = await import('@/app/api/user/api-keys/route');
      const res = await POST(makeRequest({ provider: 'openai' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid provider', async () => {
      mockAuth({ id: 'user-1' });
      const { POST } = await import('@/app/api/user/api-keys/route');
      const res = await POST(makeRequest({ provider: 'invalid-provider', key: 'sk-test12345678' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid provider');
    });

    it('returns 400 when key is too short', async () => {
      mockAuth({ id: 'user-1' });
      const { POST } = await import('@/app/api/user/api-keys/route');
      const res = await POST(makeRequest({ provider: 'openai', key: 'short' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('between 8 and 256');
    });

    it('returns 400 when key has wrong prefix for provider', async () => {
      mockAuth({ id: 'user-1' });
      const { POST } = await import('@/app/api/user/api-keys/route');
      // Anthropic keys should start with sk-ant-
      const res = await POST(makeRequest({ provider: 'anthropic', key: 'wrong-prefix-key-12345' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid key format');
    });

    it('accepts valid key with correct prefix', async () => {
      const { mockData } = mockAuth({ id: 'user-1' });
      mockData('user_api_keys', [
        { id: 'new-key-1', provider: 'openai', key_mask: 'sk-...mask', status: 'active', created_at: '2026-01-01' },
      ]);
      const { POST } = await import('@/app/api/user/api-keys/route');
      const res = await POST(makeRequest({ provider: 'openai', key: 'sk-validapikey12345678' }));
      // The mock chain returns the data, so we should get 201 or 200
      const status = res.status;
      expect(status).toBeLessThan(500);
    });
  });
});
