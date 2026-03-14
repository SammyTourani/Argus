/**
 * Mock Supabase Client for Integration Tests
 *
 * Provides a chainable mock that mirrors the Supabase JS client API
 * (from().select().eq().single(), etc.) without hitting a real database.
 *
 * Usage:
 *   const { client, mockData } = createMockSupabase();
 *   mockData('profiles', [{ id: '1', email: 'test@test.com' }]);
 *   const { data } = await client.from('profiles').select('*').eq('id', '1').single();
 */

import { vi } from 'vitest';

type MockRow = Record<string, unknown>;

interface MockTableData {
  rows: MockRow[];
  error: Error | null;
}

export function createMockSupabase() {
  const tables = new Map<string, MockTableData>();

  function mockData(table: string, rows: MockRow[], error: Error | null = null) {
    tables.set(table, { rows, error });
  }

  function getTableData(table: string): MockTableData {
    return tables.get(table) ?? { rows: [], error: null };
  }

  // Build a chainable query mock that resolves to the correct shape
  function buildChain(tableName: string) {
    const tableData = getTableData(tableName);
    let filteredRows = [...tableData.rows];

    const chain: Record<string, unknown> = {};

    const terminalMethods = {
      single: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: filteredRows[0] ?? null,
          error: tableData.error,
        }),
      ),
      maybeSingle: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: filteredRows[0] ?? null,
          error: tableData.error,
        }),
      ),
      then: undefined as unknown, // makes it thenable for direct await
    };

    // Chainable filter/modifier methods
    const chainableMethods = ['select', 'insert', 'update', 'delete', 'upsert',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
      'in', 'is', 'not', 'or', 'and', 'order', 'limit', 'range',
      'match', 'textSearch', 'filter', 'contains', 'containedBy',
      'overlaps', 'csv',
    ];

    for (const method of chainableMethods) {
      chain[method] = vi.fn().mockImplementation((..._args: unknown[]) => {
        // For 'eq', try to actually filter
        if (method === 'eq' && _args.length >= 2) {
          const [col, val] = _args;
          filteredRows = filteredRows.filter((r) => r[col as string] === val);
        }
        return {
          ...chain,
          ...terminalMethods,
          then: (resolve: (v: unknown) => void) =>
            resolve({ data: filteredRows, error: tableData.error }),
        };
      });
    }

    // Make the chain itself thenable (for `await supabase.from('x').select('*')`)
    const thenable = {
      ...chain,
      ...terminalMethods,
      then: (resolve: (v: unknown) => void) =>
        resolve({ data: filteredRows, error: tableData.error }),
    };

    return thenable;
  }

  const client = {
    from: vi.fn().mockImplementation((table: string) => buildChain(table)),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return { client, mockData };
}
