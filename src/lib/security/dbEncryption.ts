import crypto from 'crypto';

/**
 * Vertex Database Encryption Utilities
 * 
 * encryptAtRest / decryptAtRest — AES-256-CBC with random IV for storing sensitive data.
 * hashForLookup — SHA-256 deterministic hash for database lookups (email matching).
 * 
 * The random IV means encryptAtRest("hello") produces different ciphertext each call,
 * so you CANNOT use it for database matching. Use hashForLookup() for WHERE clauses.
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || 'vertex-fallback-key-dev-only-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/** Encrypt sensitive data for storage. NOT deterministic — do NOT use for lookups. */
export function encryptAtRest(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/** Decrypt data that was encrypted with encryptAtRest. */
export function decryptAtRest(text: string): string {
  if (!text || !text.includes(':')) return text;
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) return text;
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
  } catch {
    return text;
  }
}

/** Deterministic SHA-256 hash for database lookups (e.g. matching emails). Always produces the same output for the same input. */
export function hashForLookup(text: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'vertex-fallback-key-dev-only-2026';
  return crypto.createHmac('sha256', secret).update(text.toLowerCase().trim()).digest('hex');
}
