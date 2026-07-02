import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { completeChat } from './llm'
import { getLlmSettings, getDecryptedApiKey } from './db'

/**
 * Code-editing agent (Phase 3 — proposal stage).
 *
 * Turns a natural-language request into targeted search/replace edits, grounded
 * in the actual repo source. Uses content-grep to find the right file(s), then
 * asks the model for minimal find/replace snippets (never whole files — that
 * truncates on large files and is slow). This stage only PROPOSES; committing
 * to GitHub + deploying is the commit stage (needs GITHUB_TOKEN + connected repo).
 *
 * Guardrail: may only touch files under src/ plus tailwind.config.js / index.html.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

const ALLOW_PREFIXES = ['src/']
const ALLOW_EXACT = new Set(['tailwind.config.js', 'index.html'])
const DENY_SUBSTRINGS = ['..', '.env', 'node_modules', 'secret']

export function isEditablePath(rel: string): boolean {
  const p = rel.replace(/\\/g, '/').trim()
  if (!p || DENY_SUBSTRINGS.some((d) => p.includes(d))) return false
  if (ALLOW_EXACT.has(p)) return true
  return ALLOW_PREFIXES.some((pre) => p.startsWith(pre))
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(REPO_ROOT, full).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      walk(full, acc)
    } else if (isEditablePath(rel) && /\.(tsx?|css|js|html)$/.test(entry.name)) {
      acc.push(rel)
    }
  }
  return acc
}

function listSourceFiles(): string[] {
  const files: string[] = []
  walk(path.join(REPO_ROOT, 'src'), files)
  for (const f of ALLOW_EXACT) {
    if (fs.existsSync(path.join(REPO_ROOT, f))) files.push(f)
  }
  return files.sort()
}

function readSource(rel: string): string | null {
  if (!isEditablePath(rel)) return null
  const full = path.resolve(REPO_ROOT, rel)
  if (!full.startsWith(REPO_ROOT)) return null // defense-in-depth against traversal
  try {
    return fs.readFileSync(full, 'utf8')
  } catch {
    return null
  }
}

/** Pull the first JSON object/array out of an LLM reply (handles ```json fences and prose). */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.search(/[[{]/)
  if (start === -1) throw new Error('No JSON found in model response')
  const open = candidate[start]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1)) as T
    }
  }
  throw new Error('Unbalanced JSON in model response')
}

/** Distinctive phrases from the request: quoted text + Capitalized Multi-Word runs + long words. */
function extractSearchTerms(request: string): string[] {
  const terms = new Set<string>()
  for (const m of request.matchAll(/["'“”`]([^"'“”`]{3,})["'“”`]/g)) terms.add(m[1].trim())
  for (const m of request.matchAll(/\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z0-9][A-Za-z0-9]+){1,6})\b/g))
    terms.add(m[1].trim())
  for (const w of request.split(/\s+/)) {
    const clean = w.replace(/[^A-Za-z0-9]/g, '')
    if (clean.length >= 5) terms.add(clean)
  }
  return Array.from(terms)
}

/** Rank allow-listed files by how many request terms appear in their contents. */
function findCandidateFiles(terms: string[], fileList: string[]): string[] {
  if (terms.length === 0) return []
  const scored: { path: string; score: number }[] = []
  for (const p of fileList) {
    const content = readSource(p)
    if (!content) continue
    const lc = content.toLowerCase()
    let score = 0
    for (const t of terms) if (lc.includes(t.toLowerCase())) score++
    if (score > 0) scored.push({ path: p, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 6).map((s) => s.path)
}

export interface EditOp {
  path: string
  find: string
  replace: string
  applied: boolean
  note?: string
}

export interface EditProposal {
  summary: string
  edits: EditOp[]
  notes: string[]
  contextFiles: string[]
}

async function llmConfig() {
  const settings = await getLlmSettings()
  const apiKey = await getDecryptedApiKey()
  if (!apiKey) throw new Error('No API key configured. Add one in admin Settings.')
  return { provider: settings.provider, model: settings.model, apiKey }
}

/** LLM fallback file picker (only used when content-grep finds nothing). */
async function selectFilesViaLlm(request: string, fileList: string[]): Promise<string[]> {
  const cfg = await llmConfig()
  const reply = await completeChat({
    ...cfg,
    system:
      'You are a code-editing agent for a Vite + React + TypeScript dashboard. Given a change request and the ' +
      'list of source files, return ONLY a JSON array of the file paths you must read (edit target + related). ' +
      'At most 6. Return paths exactly as given.',
    messages: [{ role: 'user', content: `Request:\n${request}\n\nFiles:\n${fileList.join('\n')}` }],
  })
  try {
    return extractJson<string[]>(reply).filter((p) => fileList.includes(p)).slice(0, 6)
  } catch {
    return []
  }
}

export async function proposeEdits(request: string): Promise<EditProposal> {
  const fileList = listSourceFiles()
  const terms = extractSearchTerms(request)
  let contextFiles = findCandidateFiles(terms, fileList)
  if (contextFiles.length === 0) contextFiles = await selectFilesViaLlm(request, fileList)

  const files = contextFiles
    .map((p) => ({ path: p, content: readSource(p) }))
    .filter((f): f is { path: string; content: string } => f.content !== null)

  if (files.length === 0) {
    return {
      summary: 'Could not locate a relevant file to edit.',
      edits: [],
      notes: ['No source file matched the request. Try naming the visible text or component.'],
      contextFiles: [],
    }
  }

  const cfg = await llmConfig()
  const filesBlock = files.map((f) => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n')

  const reply = await completeChat({
    ...cfg,
    system: [
      'You are a careful code-editing agent for a Vite + React + TypeScript + Tailwind dashboard.',
      'Make the smallest change that fully satisfies the request. Preserve surrounding style and imports.',
      'You may ONLY edit files under src/ (plus tailwind.config.js and index.html).',
      'Return ONLY a JSON object of this exact shape:',
      '{"summary": string, "edits": [{"path": string, "find": string, "replace": string}], "notes": string[]}',
      'Each edit is a search/replace. "find" MUST be an exact substring copied verbatim from the given file,',
      'long enough to be unique (include surrounding context). "replace" is the new text. Do NOT output whole',
      'files — only the minimal snippets that change. If nothing needs changing, return an empty edits array.',
    ].join('\n'),
    messages: [{ role: 'user', content: `Request:\n${request}\n\nCurrent files:\n\n${filesBlock}` }],
  })

  const parsed = extractJson<{
    summary: string
    edits: { path: string; find: string; replace: string }[]
    notes?: string[]
  }>(reply)

  const notes = [...(parsed.notes || [])]
  const edits: EditOp[] = []
  for (const e of parsed.edits || []) {
    if (!e || typeof e.find !== 'string' || typeof e.replace !== 'string') continue
    if (!isEditablePath(e.path)) {
      notes.push(`Rejected out-of-bounds edit: ${e.path}`)
      continue
    }
    const content = readSource(e.path) ?? ''
    const count = content.split(e.find).length - 1
    edits.push({
      path: e.path,
      find: e.find,
      replace: e.replace,
      applied: count === 1,
      note:
        count === 0
          ? 'find text not found in file — skipped'
          : count > 1
            ? `find text appears ${count}× (not unique) — skipped`
            : undefined,
    })
  }

  return {
    summary: parsed.summary || '(no summary)',
    edits,
    notes,
    contextFiles: files.map((f) => f.path),
  }
}

/** Apply an approved proposal's edits to produce the new file contents (used by the commit stage). */
export function applyEdits(edits: EditOp[]): { path: string; newContent: string }[] {
  const byPath = new Map<string, string>()
  for (const e of edits) {
    if (!e.applied || !isEditablePath(e.path)) continue
    const current = byPath.get(e.path) ?? readSource(e.path) ?? ''
    if (!current.includes(e.find)) continue
    byPath.set(e.path, current.replace(e.find, e.replace))
  }
  return Array.from(byPath.entries()).map(([path, newContent]) => ({ path, newContent }))
}
