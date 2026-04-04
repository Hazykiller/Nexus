import crypto from 'crypto';

/**
 * Vertex At-Rest Encryption Service.
 * AES-256-CBC field-level protection for sensitive database fields.
 *
 * Key is derived via SHA-256 so it's always exactly 32 bytes regardless
 * of NEXTAUTH_SECRET length — this was the root cause of the 500 error.
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// SHA-256 derivation always produces exactly 32 bytes — safe with any secret length
function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || 'vertex-fallback-key-dev-only-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptAtRest(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptAtRest(text: string): string {
  if (!text || !text.includes(':')) return text; // Not encrypted
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) return text;
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
  } catch {
    return text; // Return plain if decryption fails (unencrypted legacy data)
  }
}
