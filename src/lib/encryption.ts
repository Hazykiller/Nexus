import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// 32 byte key derived from NEXTAUTH_SECRET
function getKey() {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret-key-32-chars-max!';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptMessage(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:encryptedData:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    console.error('Encryption failed', error);
    return text; // fallback
  }
}

export function decryptMessage(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  try {
    const [ivHex, encryptedHex, authTagHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed', error);
    return '🔒 Encrypted Message (Cannot Decrypt)';
  }
}
