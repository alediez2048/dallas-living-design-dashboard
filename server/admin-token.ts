import crypto from 'node:crypto'

/**
 * Stateless admin-session token proving the admin code was entered.
 *
 * After an allow-listed Clerk user enters the correct admin code, the server
 * issues a short-lived HMAC-signed token bound to their Clerk userId. Privileged
 * endpoints then require both a valid Clerk session AND a valid admin token — no
 * database or server-side session store needed.
 */

const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || ''
}

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url')
}

export function signAdminToken(userId: string): string {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + TTL_MS })
  const body = b64url(payload)
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyAdminToken(token: string | undefined, userId: string): boolean {
  const key = secret()
  if (!token || !key) return false
  const [body, sig] = token.split('.')
  if (!body || !sig) return false

  const expected = crypto.createHmac('sha256', key).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.uid !== userId) return false
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}
