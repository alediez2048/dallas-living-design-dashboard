import './env' // must be first: loads .env.local before anything reads process.env
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clerkMiddleware } from '@clerk/express'
import { adminStatus, adminUnlock, verifyAdmin } from './auth'
import { getSettings, postSettings, chat } from './chat'
import { proposeEdits } from './agent'
import { commitEdits, getChecks, mergePR, rollbackTo, githubConfigured, deployBranch } from './github'
import { writeAudit } from './db'
import type { Request } from 'express'

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

// --- Admin AI chat + settings (Phase 2) — all gated by verifyAdmin ---
app.get('/api/admin/settings', verifyAdmin, getSettings)
app.post('/api/admin/settings', verifyAdmin, postSettings)
app.post('/api/chat', verifyAdmin, chat)

// --- Code-editing agent (Phase 3, proposal stage) ---
app.post('/api/edit', verifyAdmin, async (req, res) => {
  try {
    const request = String(req.body?.request || '').trim()
    if (!request) return res.status(400).json({ error: 'request is required' })
    const proposal = await proposeEdits(request)
    const email = (req as Request & { adminEmail?: string }).adminEmail
    await writeAudit(email, 'edit.propose', { request, files: proposal.edits.map((e) => e.path) })
    res.json(proposal)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Edit generation failed' })
  }
})

// --- Publish flow (Phase 3 safety net) — commit -> PR -> CI gate -> merge -> rollback ---
const adminEmail = (req: Request) => (req as Request & { adminEmail?: string }).adminEmail

app.get('/api/publish/config', verifyAdmin, (_req, res) => {
  res.json({ githubConfigured: githubConfigured(), deployBranch: githubConfigured() ? deployBranch() : null })
})

// Commit approved edits to a new branch + open a PR (CI runs the build on it).
app.post('/api/publish', verifyAdmin, async (req, res) => {
  try {
    if (!githubConfigured()) return res.status(400).json({ error: 'GitHub is not configured (GITHUB_TOKEN/GITHUB_REPO).' })
    const { edits, request } = req.body ?? {}
    if (!Array.isArray(edits) || !edits.length) return res.status(400).json({ error: 'edits[] required' })
    const result = await commitEdits(edits, String(request || 'admin edit'), adminEmail(req))
    await writeAudit(adminEmail(req), 'publish.commit', { request, branch: result.branch, pr: result.pr.number })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Commit failed' })
  }
})

// CI build-gate status for a PR head commit.
app.get('/api/publish/checks', verifyAdmin, async (req, res) => {
  try {
    const ref = String(req.query.ref || '')
    if (!ref) return res.status(400).json({ error: 'ref required' })
    res.json(await getChecks(ref))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to read checks' })
  }
})

// Merge the PR into the deploy branch (only after CI is green — enforced in UI + re-checked here).
app.post('/api/publish/merge', verifyAdmin, async (req, res) => {
  try {
    const { number, headSha } = req.body ?? {}
    if (!number || !headSha) return res.status(400).json({ error: 'number and headSha required' })
    const checks = await getChecks(String(headSha))
    if (checks.state === 'failure') return res.status(409).json({ error: 'CI failed — cannot publish.' })
    if (checks.state === 'pending') return res.status(409).json({ error: 'CI still running — try again shortly.' })
    const result = await mergePR(Number(number), String(headSha))
    await writeAudit(adminEmail(req), 'publish.merge', { pr: number, mergeSha: result.sha, rollbackTo: result.baseShaBefore })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Merge failed' })
  }
})

// Roll the deploy branch back to a prior state.
app.post('/api/publish/rollback', verifyAdmin, async (req, res) => {
  try {
    const { oldSha, reason } = req.body ?? {}
    if (!oldSha) return res.status(400).json({ error: 'oldSha required' })
    const result = await rollbackTo(String(oldSha), String(reason || 'admin rollback'))
    await writeAudit(adminEmail(req), 'publish.rollback', { to: oldSha, sha: result.sha })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Rollback failed' })
  }
})

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
