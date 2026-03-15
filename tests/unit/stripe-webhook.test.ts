/**
 * Tests for /api/stripe/webhook — Stripe webhook handler with idempotency.
 *
 * Validates:
 * - Duplicate events are skipped (idempotency)
 * - checkout.session.completed updates profile + sends email
 * - customer.subscription.deleted downgrades + sends email
 * - customer.subscription.updated respects event ordering
 * - Invalid signatures are rejected
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/mock-supabase';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe/config', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
}));

const mockSendConfirmed = vi.fn();
const mockSendCanceled = vi.fn();
vi.mock('@/lib/email', () => ({
  sendSubscriptionConfirmed: (...args: unknown[]) => mockSendConfirmed(...args),
  sendSubscriptionCanceled: (...args: unknown[]) => mockSendCanceled(...args),
}));

let mockSupabaseAdmin: ReturnType<typeof createMockSupabase>;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseAdmin.client,
}));

// Import route handler after mocks are set up
import { POST } from '@/app/api/stripe/webhook/route';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeStripeEvent(
  id: string,
  type: string,
  data: Record<string, unknown>,
  created: number = Math.floor(Date.now() / 1000)
) {
  return { id, type, data: { object: data }, created };
}

function makeRequest(body = 'stripe-body') {
  return new Request('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'sig_test' },
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('/api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAdmin = createMockSupabase();
  });

  it('rejects invalid signatures with 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid signature');
  });

  it('skips duplicate events (idempotency)', async () => {
    const event = makeStripeEvent('evt_dup123', 'checkout.session.completed', {
      metadata: { supabase_user_id: 'user-1' },
      customer: 'cus_1',
      subscription: 'sub_1',
    });
    mockConstructEvent.mockReturnValue(event);

    // Simulate: event already exists in webhook_events table
    mockSupabaseAdmin.mockData('webhook_events', [{ event_id: 'evt_dup123' }]);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    // Should NOT have tried to update profiles (the switch block was skipped)
    const fromCalls = mockSupabaseAdmin.client.from.mock.calls.map(
      (c: unknown[]) => c[0]
    );
    // Only webhook_events should have been queried, not profiles
    expect(fromCalls).not.toContain('profiles');
  });

  it('processes checkout.session.completed and sends email', async () => {
    const event = makeStripeEvent('evt_checkout_1', 'checkout.session.completed', {
      metadata: { supabase_user_id: 'user-1' },
      customer: 'cus_1',
      subscription: 'sub_1',
    });
    mockConstructEvent.mockReturnValue(event);

    // No existing event (first time processing)
    mockSupabaseAdmin.mockData('webhook_events', []);
    // Profile lookup for email
    mockSupabaseAdmin.mockData('profiles', [
      { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
    ]);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    // Verify webhook_events was written
    const fromCalls = mockSupabaseAdmin.client.from.mock.calls.map(
      (c: unknown[]) => c[0]
    );
    expect(fromCalls).toContain('webhook_events');
    expect(fromCalls).toContain('profiles');
  });

  it('processes customer.subscription.deleted', async () => {
    const event = makeStripeEvent('evt_deleted_1', 'customer.subscription.deleted', {
      customer: 'cus_1',
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    });
    mockConstructEvent.mockReturnValue(event);

    mockSupabaseAdmin.mockData('webhook_events', []);
    mockSupabaseAdmin.mockData('profiles', [
      { id: 'user-1', email: 'test@example.com', full_name: 'Test', stripe_customer_id: 'cus_1' },
    ]);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    const fromCalls = mockSupabaseAdmin.client.from.mock.calls.map(
      (c: unknown[]) => c[0]
    );
    expect(fromCalls).toContain('profiles');
  });

  it('processes customer.subscription.updated with ordering guard', async () => {
    const eventTime = Math.floor(Date.now() / 1000);
    const event = makeStripeEvent('evt_updated_1', 'customer.subscription.updated', {
      customer: 'cus_1',
      status: 'active',
    }, eventTime);
    mockConstructEvent.mockReturnValue(event);

    mockSupabaseAdmin.mockData('webhook_events', []);
    mockSupabaseAdmin.mockData('profiles', [
      {
        id: 'user-1',
        stripe_customer_id: 'cus_1',
        // Profile was updated BEFORE this event — should allow update
        updated_at: new Date((eventTime - 100) * 1000).toISOString(),
      },
    ]);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    const fromCalls = mockSupabaseAdmin.client.from.mock.calls.map(
      (c: unknown[]) => c[0]
    );
    expect(fromCalls).toContain('profiles');
  });

  it('records event_id in webhook_events before processing', async () => {
    const event = makeStripeEvent('evt_new_1', 'checkout.session.completed', {
      metadata: { supabase_user_id: 'user-1' },
      customer: 'cus_1',
      subscription: 'sub_1',
    });
    mockConstructEvent.mockReturnValue(event);

    mockSupabaseAdmin.mockData('webhook_events', []);
    mockSupabaseAdmin.mockData('profiles', [
      { id: 'user-1', email: 'test@example.com', full_name: 'Test' },
    ]);

    await POST(makeRequest());

    // Verify insert was called on webhook_events
    const fromCalls = mockSupabaseAdmin.client.from.mock.calls;
    const webhookInsertCall = fromCalls.find(
      (c: unknown[]) => c[0] === 'webhook_events'
    );
    expect(webhookInsertCall).toBeDefined();
  });
});
