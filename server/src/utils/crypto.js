import crypto from 'crypto';

function deriveKey(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest();
}

export function encryptMessage(plainText, secret) {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: tag.toString('base64')
  };
}

export function decryptMessage(payload, secret) {
  if (!payload?.encryptedText) return '';
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedText, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

export function createRoomSecret() {
  return crypto.randomBytes(32).toString('hex');
}