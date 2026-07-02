import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { signAdminToken, verifyAdminToken } from './admin-token'

const ADMIN_TOKEN_HEADER = 'x-admin-token'

function adminAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function isEmailAllowed(email: string | null): boolean {
  return !!email && adminAllowlist().includes(email)
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

async function getUserEmail(userId: string): Promise<string | null> {
  const user = await clerkClient.users.getUser(userId)
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
  const email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? ''
  return email ? email.toLowerCase() : null
}

/**
 * GET /api/admin/status
 * Reports the caller's admin standing so the UI can decide what to show.
 * Never trusts the client — all three checks run server-side.
 */
export async function adminStatus(req: Request, res: Response) {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.json({ signedIn: false, emailAllowed: false, isAdmin: false })
  }
  const email = await getUserEmail(userId)
  const emailAllowed = isEmailAllowed(email)
  const token = req.header(ADMIN_TOKEN_HEADER)
  const isAdmin = emailAllowed && verifyAdminToken(token, userId)
  return res.json({ signedIn: true, email, emailAllowed, isAdmin })
}

/**
 * POST /api/admin/unlock  { code }
 * Requires a signed-in, allow-listed user + the correct admin code.
 * On success, returns a short-lived admin token bound to their Clerk userId.
 */
export async function adminUnlock(req: Request, res: Response) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Not signed in' })

  const email = await getUserEmail(userId)
  if (!isEmailAllowed(email)) {
    return res.status(403).json({ error: 'This account is not authorized for admin access' })
  }

  const expected = process.env.ADMIN_CODE || ''
  const code = typeof req.body?.code === 'string' ? req.body.code : ''
  if (!expected || !safeEqual(code, expected)) {
    return res.status(403).json({ error: 'Invalid admin code' })
  }

  return res.json({ isAdmin: true, adminToken: signAdminToken(userId) })
}

/**
 * Middleware guarding privileged routes (chat, edit, publish — Phase 2+).
 * Enforces: valid Clerk session AND allow-listed email AND valid admin token.
 */
export async function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Not signed in' })

  const email = await getUserEmail(userId)
  if (!isEmailAllowed(email)) {
    return res.status(403).json({ error: 'Not authorized for admin access' })
  }
  if (!verifyAdminToken(req.header(ADMIN_TOKEN_HEADER), userId)) {
    return res.status(403).json({ error: 'Admin code required' })
  }

  ;(req as Request & { adminEmail?: string }).adminEmail = email ?? undefined
  next()
}
