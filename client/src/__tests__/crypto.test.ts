import { describe, it, expect } from 'vitest';
import { hashPin, encryptText, decryptText } from '../lib/crypto';
import { encryptPayload, decryptPayload } from '../lib/encryption';

describe('Cryptographic & Security Utilities', () => {
  describe('hashPin', () => {
    it('should generate a 64-character hexadecimal SHA-256 hash', async () => {
      const pin = '1402';
      const hash = await hashPin(pin);
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('should produce identical hash for identical input (deterministic)', async () => {
      const hash1 = await hashPin('798933');
      const hash2 = await hashPin('798933');
      expect(hash1).toBe(hash2);
    });

    it('should produce completely different hashes for different pins', async () => {
      const hashA = await hashPin('1234');
      const hashB = await hashPin('1235');
      expect(hashA).not.toBe(hashB);
    });
  });

  describe('encryptText & decryptText (AES-GCM)', () => {
    it('should encrypt and decrypt a message back to original text', async () => {
      const original = 'Hello Humera ❤️ In Our Universe';
      const ciphertext = await encryptText(original);

      expect(ciphertext).not.toBe(original);
      expect(typeof ciphertext).toBe('string');
      expect(ciphertext.length).toBeGreaterThan(10);

      const decrypted = await decryptText(ciphertext);
      expect(decrypted).toBe(original);
    });

    it('should support custom secret keys', async () => {
      const original = 'Secret Couple Coordinates: 28.6139, 77.2090';
      const customKey = 'custom_secret_couple_key_2026_x';
      const ciphertext = await encryptText(original, customKey);

      const decrypted = await decryptText(ciphertext, customKey);
      expect(decrypted).toBe(original);

      // Decrypting with wrong key returns unparsed ciphertext safely
      const wrongDecrypted = await decryptText(ciphertext, 'wrong_key_12345678901234567890');
      expect(wrongDecrypted).not.toBe(original);
    });

    it('should handle special characters, multiline text, and emojis', async () => {
      const complexText = '🚀 Special Characters: !@#$%^&*()_+ \n Newline \t Tab \n 🌟✨💖';
      const encrypted = await encryptText(complexText);
      const decrypted = await decryptText(encrypted);
      expect(decrypted).toBe(complexText);
    });
  });

  describe('encryptPayload & decryptPayload (Payload Protection)', () => {
    it('should encrypt and decrypt full JSON payloads securely', async () => {
      const payload = JSON.stringify({
        sender: 'Naveen',
        recipient: 'Humera',
        message: 'Forever & Always',
        timestamp: 1788880000000
      });

      const encrypted = await encryptPayload(payload);
      expect(encrypted).not.toBe(payload);

      const decrypted = await decryptPayload(encrypted);
      expect(decrypted).toBe(payload);
      const parsed = JSON.parse(decrypted);
      expect(parsed.sender).toBe('Naveen');
      expect(parsed.recipient).toBe('Humera');
    });
  });
});
