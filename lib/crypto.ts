/**
 * AES-256-GCM encryption/decryption for BYOK API key storage.
 *
 * Requires ENCRYPTION_KEY env var — 64-char hex string (32 bytes).
 * Format: [12-byte IV][16-byte authTag][ciphertext]
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack as: IV + authTag + ciphertext, return as hex string for DB storage
  return Buffer.concat([iv, authTag, encrypted]).toString('hex');
}

export function decrypt(hexString: string): string {
  const key = getKey();
  const packed = Buffer.from(hexString, 'hex');
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Derive a display mask from a raw API key.
 * e.g., "sk-proj-abc123xyz789" -> "sk-...789"
 */
export function deriveKeyMask(key: string): string {
  if (key.length <= 8) return '***';
  const prefix = key.substring(0, key.indexOf('-', 3) + 1 || 3);
  const suffix = key.substring(key.length - 4);
  return prefix + '...' + suffix;
}
