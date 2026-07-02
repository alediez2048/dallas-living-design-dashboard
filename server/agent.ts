import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { completeChat } from './llm'
import { getLlmSettings, getDecryptedApiKey } from './db'

/**
 * Code-editing agent (Phase 3 — proposal stage).
 *
 * Turns a natural-language request into a set of proposed file edits, grounded
 * in the actual repo source. This stage only PROPOSES — committing to GitHub,
 * preview deploys, and publishing to production are the commit stage (T3.3+),
 * which is gated on GITHUB_TOKEN + a GitHub-connected Railway service.
 *
 * Guardrail: the agent may only read/write files under an allow-list (src/ and a
 * couple of safe config files). It can never touch server code, secrets, CI
 * workflows, or package manifests.
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
    } else if (isEditablePath(rel) && /\.(tsx?|css|js)$/.test(entry.name)) {
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
  // Walk to the matching close bracket.
  const open = candidate[start]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === open) depth++
    else if (candidate[i] === close) {
      depth--
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1)) as T
    }
  }
  throw new Error('Unbalanced JSON in model response')
}

export interface EditProposal {
  summary: string
  edits: { path: string; oldContent: string; newContent: string }[]
  notes: string[]
  contextFiles: string[]
}

async function llmConfig() {
  const settings = await getLlmSettings()
  const apiKey = await getDecryptedApiKey()
  if (!apiKey) throw new Error('No API key configured. Add one in admin Settings.')
  return { provider: settings.provider, model: settings.model, apiKey }
}

/** Given the request + file list, ask the model which files it needs to read. */
async function selectFiles(request: string, fileList: string[]): Promise<string[]> {
  const cfg = await llmConfig()
  const reply = await completeChat({
    ...cfg,
    system:
      'You are a code-editing agent for a Vite + React + TypeScript dashboard. Given a change request ' +
      'and the list of source files, return ONLY a JSON array of the file paths you must read to make the ' +
      'change (include files you will edit AND closely related files for context). Choose at most 8. ' +
      'Return the paths exactly as given.',
    messages: [
      { role: 'user', content: `Request:\n${request}\n\nFiles:\n${fileList.join('\n')}` },
    ],
  })
  const picked = extractJson<string[]>(reply)
  return picked.filter((p) => fileList.includes(p)).slice(0, 8)
}

/** Given the request + file contents, ask the model to produce full-file edits. */
export async function proposeEdits(request: string): Promise<EditProposal> {
  const fileList = listSourceFiles()
  const contextFiles = await selectFiles(request, fileList)
  const files = contextFiles
    .map((p) => ({ path: p, content: readSource(p) }))
    .filter((f): f is { path: string; content: string } => f.content !== null)

  const cfg = await llmConfig()
  const filesBlock = files
    .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
    .join('\n\n')

  const reply = await completeChat({
    ...cfg,
    system: [
      'You are a careful code-editing agent for a Vite + React + TypeScript + Tailwind dashboard.',
      'Make the smallest change that fully satisfies the request. Preserve existing style and imports.',
      'You may ONLY edit files under src/ (plus tailwind.config.js and index.html). Never touch server code,',
      'secrets, CI, or package manifests.',
      'Return ONLY a JSON object of this exact shape:',
      '{"summary": string, "edits": [{"path": string, "newContent": string}], "notes": string[]}',
      'newContent must be the COMPLETE new contents of the file (not a diff). Only include files you changed.',
    ].join('\n'),
    messages: [
      { role: 'user', content: `Request:\n${request}\n\nCurrent files:\n\n${filesBlock}` },
    ],
  })

  const parsed = extractJson<{ summary: string; edits: { path: string; newContent: string }[]; notes?: string[] }>(
    reply,
  )

  const edits = (parsed.edits || [])
    .filter((e) => e && typeof e.path === 'string' && typeof e.newContent === 'string')
    .filter((e) => isEditablePath(e.path)) // enforce guardrail on the model's output
    .map((e) => ({
      path: e.path,
      oldContent: readSource(e.path) ?? '',
      newContent: e.newContent,
    }))

  const rejected = (parsed.edits || []).filter((e) => e?.path && !isEditablePath(e.path)).map((e) => e.path)
  const notes = [...(parsed.notes || [])]
  if (rejected.length) notes.push(`Rejected out-of-bounds edits: ${rejected.join(', ')}`)

  return {
    summary: parsed.summary || '(no summary)',
    edits,
    notes,
    contextFiles: files.map((f) => f.path),
  }
}
