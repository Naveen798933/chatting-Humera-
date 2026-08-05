/**
 * Client-Side Cryptographic & Security Utilities
 * Uses native Web Crypto API (SubtleCrypto) for zero-dependency AES-GCM encryption & hashing
 */

// Simple SHA-256 hash helper
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt string with AES-GCM 256
export async function encryptText(text: string, secretKeyStr: string = 'our_universe_secret_2026'): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKeyStr.padEnd(32, '0').slice(0, 32));
    const key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt']);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    return text; // Fallback to plain if crypto fails
  }
}

// Decrypt string with AES-GCM 256
export async function decryptText(cipherB64: string, secretKeyStr: string = 'our_universe_secret_2026'): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKeyStr.padEnd(32, '0').slice(0, 32));
    const key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['decrypt']);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return cipherB64; // Fallback to raw if not encrypted
  }
}
