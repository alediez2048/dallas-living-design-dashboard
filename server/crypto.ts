import crypto from 'node:crypto'

/**
 * Symmetric encryption for secrets at rest (admin BYO LLM API keys).
 * AES-256-GCM with a per-value random IV. The 32-byte key is derived from
 * ADMIN_SESSION_SECRET so we don't introduce another env var.
 *
 * Stored form: base64(iv).base64(authTag).base64(ciphertext)
 */

function key(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return crypto.createHash('sha256').update(secret).digest() // 32 bytes
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted value')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}
