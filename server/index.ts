import './env' // must be first: loads .env.local before anything reads process.env
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clerkMiddleware } from '@clerk/express'
import { adminStatus, adminUnlock } from './auth'

/**
 * Dallas Living Design Dashboard — backend service (Railway).
 *
 * One persistent Node process serves BOTH:
 *   1. the built React SPA (dist/) at the root, and
 *   2. the /api/* endpoints (auth, LLM proxy, code-editing agent — added in later phases).
 *
 * Because this is a long-lived service (not a serverless function), request handlers
 * have no execution-time limit — the code-editing agent can run as long as it needs.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')

const app = express()
// Railway injects PORT; fall back to 3000 for local dev.
const PORT = Number(process.env.PORT) || 3000

app.use(express.json({ limit: '1mb' }))

// Populates request auth from the Clerk session (Bearer token or cookie).
app.use(clerkMiddleware())

// --- API ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dallas-living-design-dashboard' })
})

// --- Admin auth (Phase 1) ---
// Public dashboard needs none of this; these gate admin-only features.
app.get('/api/admin/status', adminStatus)
app.post('/api/admin/unlock', adminUnlock)

// TODO (Phase 2+): /api/chat, /api/edit, /api/publish, /api/keys, /api/audit
// all guarded by verifyAdmin().

// --- Static frontend ---
app.use(express.static(distPath))

// SPA fallback: any non-API route serves index.html so client-side routing works.
// (Uses a path-less middleware to stay compatible across Express 4/5.)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT} (serving ${distPath})`)
})
