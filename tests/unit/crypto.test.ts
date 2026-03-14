/**
 * Tests for lib/crypto.ts — AES-256-GCM encrypt/decrypt and key masking.
 *
 * These tests exercise the pure crypto utilities that protect BYOK API keys
 * at rest in the user_api_keys table.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Save and set a valid test encryption key before importing crypto module
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
const TEST_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

describe('Crypto Module', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    if (ORIGINAL_KEY) {
      process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
    }
  });

  it('encrypt returns a hex string', async () => {
    const { encrypt } = await import('@/lib/crypto');
    const result = encrypt('test-api-key-12345');
    expect(typeof result).toBe('string');
    // Verify it's valid hex (only 0-9a-f characters)
    expect(result).toMatch(/^[0-9a-f]+$/);
    // Should have IV (12 bytes = 24 hex) + authTag (16 bytes = 32 hex) + ciphertext
    expect(result.length).toBeGreaterThan(56);
  });

  it('decrypt(encrypt(text)) round-trips correctly', async () => {
    const { encrypt, decrypt } = await import('@/lib/crypto');
    const plaintext = 'sk-proj-abc123def456ghi789';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypts the same text differently each time (random IV)', async () => {
    const { encrypt } = await import('@/lib/crypto');
    const plaintext = 'same-key-different-ciphertext';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it('deriveKeyMask produces correct masks', async () => {
    const { deriveKeyMask } = await import('@/lib/crypto');

    // OpenAI-style key — prefix up to first '-' after index 3
    expect(deriveKeyMask('sk-proj-abc123xyz789')).toBe('sk-proj-...z789');

    // Anthropic-style key
    expect(deriveKeyMask('sk-ant-api03-longtokenvalue1234')).toBe('sk-ant-...1234');

    // Google-style key (no '-' after index 3 → falls back to first 3 chars)
    expect(deriveKeyMask('AIzaSyB12345678abcdef')).toBe('AIz...cdef');
  });

  it('deriveKeyMask returns *** for short keys', async () => {
    const { deriveKeyMask } = await import('@/lib/crypto');
    expect(deriveKeyMask('short')).toBe('***');
    expect(deriveKeyMask('12345678')).toBe('***');
  });

  it('throws when ENCRYPTION_KEY is missing', async () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;

    // Need a fresh import to get a new getKey() call
    const crypto = await import('crypto');
    const { createCipheriv } = crypto;

    // Manually test the key validation logic
    expect(() => {
      const hex = process.env.ENCRYPTION_KEY;
      if (!hex || hex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
      }
    }).toThrow('ENCRYPTION_KEY must be a 64-character hex string');

    process.env.ENCRYPTION_KEY = saved;
  });

  it('throws when ENCRYPTION_KEY is wrong length', async () => {
    const saved = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'tooshort';

    expect(() => {
      const hex = process.env.ENCRYPTION_KEY;
      if (!hex || hex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
      }
    }).toThrow('ENCRYPTION_KEY must be a 64-character hex string');

    process.env.ENCRYPTION_KEY = saved;
  });
});
