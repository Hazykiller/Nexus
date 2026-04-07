import crypto from 'crypto';

export function generateBase32Secret(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) secret += chars[bytes[i] % 32];
  return secret;
}

export function generateKeyUri(account: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || token.length !== 6) return false;
  
  // Base32 decode
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < secret.length; i++) {
    const val = chars.indexOf(secret[i].toUpperCase());
    if (val === -1) return false;
    bits += val.toString(2).padStart(5, '0');
  }
  
  // Pad bits to be a multiple of 8
  const padding = (8 - (bits.length % 8)) % 8;
  bits += '0'.repeat(padding);

  const hexLines = bits.match(/.{1,8}/g);
  if (!hexLines) return false;
  
  const key = Buffer.from(hexLines.map(b => parseInt(b, 2)));

  const verifyForTime = (timeStep: number) => {
    const timeBuffer = Buffer.alloc(8);
    // Write high 32 bits and low 32 bits
    const high = Math.floor(timeStep / 4294967296); // 2^32
    const low = timeStep % 4294967296;
    timeBuffer.writeUInt32BE(high, 0);
    timeBuffer.writeUInt32BE(low, 4);

    const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0') === token;
  };

  const currentStep = Math.floor(Date.now() / 30000);
  for (let i = -window; i <= window; i++) {
    if (verifyForTime(currentStep + i)) return true;
  }
  return false;
}
