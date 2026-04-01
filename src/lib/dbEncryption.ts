import crypto from 'crypto';

/**
 * Advanced At-Rest Encryption Service for 'Vertex Airtight'.
 * Encrypts sensitive metadata (Emails, Phone numbers) before Neo4j persistence.
 * This is a separate layer from Messaging E2EE, protecting against DB leaks.
 */

const ALGORITHM = 'aes-256-cbc';
// This would be stored in process.env.DB_AT_REST_SECRET in production
const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'vertex-at-rest-secret-2025-01-01';
const IV_LENGTH = 16;

export function encryptAtRest(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptAtRest(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text; // Fallback for unencrypted legacy data if any
  }
}
