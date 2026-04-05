/**
 * Re-export shim – canonical module moved to @/lib/security/dbEncryption
 * This file exists for backwards-compatibility only.
 */
export { encryptAtRest, decryptAtRest, hashForLookup } from './security/dbEncryption';
