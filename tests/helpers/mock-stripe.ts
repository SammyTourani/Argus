/**
 * Mock Stripe Client for Integration Tests
 *
 * Provides mock implementations of the Stripe SDK methods used in Argus:
 * customers, subscriptions, checkout sessions, and webhook event construction.
 *
 * Usage:
 *   const stripe = createMockStripe();
 *   const customer = await stripe.customers.create({ email: 'test@test.com' });
 */

import { vi } from 'vitest';

interface MockCustomer {
  id: string;
  email: string;
  metadata: Record<string, string>;
}

interface MockSubscription {
  id: string;
  customer: string;
  status: string;
  items: { data: { price: { id: string } }[] };
}

interface MockCheckoutSession {
  id: string;
  url: string;
  customer: string;
  mode: string;
}

let customerCounter = 0;
let subscriptionCounter = 0;
let sessionCounter = 0;

export function createMockStripe() {
  customerCounter = 0;
  subscriptionCounter = 0;
  sessionCounter = 0;

  return {
    customers: {
      create: vi.fn().mockImplementation(
        (params: { email: string; metadata?: Record<string, string> }): Promise<MockCustomer> =>
          Promise.resolve({
            id: `cus_test_${++customerCounter}`,
            email: params.email,
            metadata: params.metadata ?? {},
          }),
      ),
      retrieve: vi.fn().mockImplementation(
        (id: string): Promise<MockCustomer> =>
          Promise.resolve({
            id,
            email: 'test@test.com',
            metadata: {},
          }),
      ),
      update: vi.fn().mockImplementation(
        (id: string, params: Partial<MockCustomer>): Promise<MockCustomer> =>
          Promise.resolve({
            id,
            email: params.email ?? 'test@test.com',
            metadata: params.metadata ?? {},
          }),
      ),
    },

    subscriptions: {
      retrieve: vi.fn().mockImplementation(
        (id: string): Promise<MockSubscription> =>
          Promise.resolve({
            id,
            customer: 'cus_test_1',
            status: 'active',
            items: { data: [{ price: { id: 'price_pro_monthly' } }] },
          }),
      ),
      list: vi.fn().mockImplementation(
        (): Promise<{ data: MockSubscription[] }> =>
          Promise.resolve({ data: [] }),
      ),
      cancel: vi.fn().mockImplementation(
        (id: string): Promise<MockSubscription> =>
          Promise.resolve({
            id,
            customer: 'cus_test_1',
            status: 'canceled',
            items: { data: [] },
          }),
      ),
    },

    checkout: {
      sessions: {
        create: vi.fn().mockImplementation(
          (params: {
            customer?: string;
            mode?: string;
          }): Promise<MockCheckoutSession> =>
            Promise.resolve({
              id: `cs_test_${++sessionCounter}`,
              url: 'https://checkout.stripe.com/test',
              customer: params.customer ?? 'cus_test_1',
              mode: params.mode ?? 'subscription',
            }),
        ),
        retrieve: vi.fn().mockImplementation(
          (id: string): Promise<MockCheckoutSession> =>
            Promise.resolve({
              id,
              url: 'https://checkout.stripe.com/test',
              customer: 'cus_test_1',
              mode: 'subscription',
            }),
        ),
      },
    },

    webhooks: {
      constructEvent: vi.fn().mockImplementation(
        (body: string, sig: string, secret: string) => ({
          id: 'evt_test_1',
          type: 'checkout.session.completed',
          data: { object: JSON.parse(body) },
        }),
      ),
    },

    billingPortal: {
      sessions: {
        create: vi.fn().mockImplementation(
          (params: { customer: string; return_url: string }) =>
            Promise.resolve({
              id: `bps_test_1`,
              url: 'https://billing.stripe.com/test',
            }),
        ),
      },
    },
  };
}
