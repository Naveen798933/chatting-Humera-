/**
 * Client-Side Payload Encryption & Decryption Utility (AES-GCM 256-bit)
 * Enforces payload security before writing data to Firestore / LocalStorage
 */

const SECRET_UNIVERSE_KEY_STRING = "OUR_UNIVERSE_NAVEEN_HUMERA_PRIVATE_KEY_798933_140299";

// Generate or derive CryptoKey from constant secret string
async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(SECRET_UNIVERSE_KEY_STRING);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plain text payload
 */
export async function encryptPayload(plainText: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedPayload = enc.encode(plainText);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedPayload
    );

    // Pack IV and Ciphertext as Base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.warn('Encryption fallback to plain string:', error);
    return plainText;
  }
}

/**
 * Decrypt encrypted payload string
 */
export async function decryptPayload(cipherTextBase64: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const binary = atob(cipherTextBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    // If string was plain or legacy format, return as is
    return cipherTextBase64;
  }
}
