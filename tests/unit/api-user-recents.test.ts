/**
 * Tests for /api/user/recents routes — recently viewed projects.
 *
 * Mocks @/lib/supabase/server (createClient) to avoid real DB calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase } from '../helpers/mock-supabase';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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

function makePostRequest(body?: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/user/recents', {
    method: 'POST',
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

describe('/api/user/recents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ────────────────────────────────────────────────────────────────

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuth(null);
      const { GET } = await import('@/app/api/user/recents/route');
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns empty array when no recents', async () => {
      const { mockData } = mockAuth({ id: 'user-1' });
      mockData('recent_views', []);
      const { GET } = await import('@/app/api/user/recents/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.recents).toEqual([]);
    });

    it('returns formatted recents list', async () => {
      const { mockData } = mockAuth({ id: 'user-1' });
      mockData('recent_views', [
        {
          user_id: 'user-1',
          project_id: 'proj-1',
          viewed_at: '2026-01-15T10:00:00Z',
          projects: { id: 'proj-1', name: 'My Project', description: 'A test project', thumbnail_url: null },
        },
      ]);
      const { GET } = await import('@/app/api/user/recents/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.recents).toHaveLength(1);
      expect(json.recents[0].project_id).toBe('proj-1');
      expect(json.recents[0].project_name).toBe('My Project');
      expect(json.recents[0].viewed_at).toBe('2026-01-15T10:00:00Z');
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuth(null);
      const { POST } = await import('@/app/api/user/recents/route');
      const res = await POST(makePostRequest({ project_id: 'proj-1' }));
      expect(res.status).toBe(401);
    });

    it('returns 400 when project_id is missing', async () => {
      mockAuth({ id: 'user-1' });
      const { POST } = await import('@/app/api/user/recents/route');
      const res = await POST(makePostRequest({}));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('project_id');
    });

    it('returns success on valid upsert', async () => {
      const { mockData } = mockAuth({ id: 'user-1' });
      mockData('recent_views', []);
      const { POST } = await import('@/app/api/user/recents/route');
      const res = await POST(makePostRequest({ project_id: 'proj-1' }));
      const status = res.status;
      expect(status).toBeLessThan(500);
    });
  });
});
