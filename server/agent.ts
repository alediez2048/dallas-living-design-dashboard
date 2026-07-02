import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runToolLoop, type AgentTool, type ToolExecutor } from './llm'
import { getLlmSettings, getDecryptedApiKey } from './db'

/**
 * Agentic code-editing agent (Phase 3).
 *
 * The model is given tools — list_files, grep, read_file, propose_edit — and
 * runs a native tool-use loop: it searches for the relevant code, reads it,
 * and proposes minimal search/replace edits, getting validation feedback on
 * each one (find must exist and be unique). This is far more reliable than a
 * single blind pass. It still only PROPOSES; the commit/PR/CI/publish safety
 * net is what carries changes to production.
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
  for (const f of ALLOW_EXACT) if (fs.existsSync(path.join(REPO_ROOT, f))) files.push(f)
  return files.sort()
}

function readSource(rel: string): string | null {
  if (!isEditablePath(rel)) return null
  const full = path.resolve(REPO_ROOT, rel)
  if (!full.startsWith(REPO_ROOT)) return null
  try {
    return fs.readFileSync(full, 'utf8')
  } catch {
    return null
  }
}

function grepRepo(query: string): string {
  const q = query.trim().toLowerCase()
  if (!q) return 'ERROR: query is required.'
  const out: string[] = []
  let fileCount = 0
  for (const p of listSourceFiles()) {
    const content = readSource(p)
    if (!content) continue
    const lines = content.split('\n')
    const hits: string[] = []
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        hits.push(`  L${i + 1}: ${lines[i].trim().slice(0, 160)}`)
        if (hits.length >= 6) break
      }
    }
    if (hits.length) {
      out.push(`FILE: ${p}\n${hits.join('\n')}`)
      if (++fileCount >= 20) break
    }
  }
  return out.length ? out.join('\n\n') : `No matches for "${query}".`
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

const TOOLS: AgentTool[] = [
  {
    name: 'list_files',
    description: 'List every editable source file in the project.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'grep',
    description: 'Search all source files for a literal string (case-insensitive). Returns matching files and lines. Use this first to locate visible text, components, or symbols.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'text to search for' } },
      required: ['query'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the full contents of one source file so you can copy exact snippets.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'repo-relative path, e.g. src/App.tsx' } },
      required: ['path'],
    },
  },
  {
    name: 'propose_edit',
    description:
      'Propose one search/replace edit. "find" MUST be an exact substring copied verbatim from the file, long enough to be unique. Returns OK, or an error to fix.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        find: { type: 'string' },
        replace: { type: 'string' },
      },
      required: ['path', 'find', 'replace'],
    },
  },
]

const SYSTEM = [
  'You are an expert code-editing agent for a Vite + React + TypeScript + Tailwind dashboard.',
  'Goal: make the SMALLEST change that fully satisfies the user request. Preserve surrounding style.',
  'Workflow: use `grep` to locate the relevant code/text, `read_file` to see exact context, then',
  '`propose_edit` with a `find` snippet copied verbatim (include enough surrounding text to be unique)',
  'and its `replace`. You may ONLY edit files under src/ (plus tailwind.config.js and index.html).',
  'Check each propose_edit result: if it errors, read the file and fix your snippet — do not give up.',
  'When every needed edit is recorded successfully, STOP calling tools and reply with a one-paragraph',
  'summary of exactly what you changed and where.',
].join('\n')

async function llmConfig() {
  const settings = await getLlmSettings()
  const apiKey = await getDecryptedApiKey()
  if (!apiKey) throw new Error('No API key configured. Add one in admin Settings.')
  return { provider: settings.provider, model: settings.model, apiKey }
}

export async function proposeEdits(request: string): Promise<EditProposal> {
  const cfg = await llmConfig()
  const edits: EditOp[] = []
  const visited = new Set<string>()

  const execute: ToolExecutor = async (name, args) => {
    if (name === 'list_files') return listSourceFiles().join('\n')

    if (name === 'grep') return grepRepo(String(args.query ?? ''))

    if (name === 'read_file') {
      const p = String(args.path ?? '')
      const content = readSource(p)
      if (content === null) return `ERROR: cannot read "${p}" (not an editable file).`
      visited.add(p)
      return content.length > 60000 ? content.slice(0, 60000) + '\n... (truncated)' : content
    }

    if (name === 'propose_edit') {
      const p = String(args.path ?? '')
      const find = String(args.find ?? '')
      const replace = String(args.replace ?? '')
      if (!isEditablePath(p)) return `ERROR: "${p}" is not editable (only src/ + tailwind.config.js/index.html).`
      const content = readSource(p)
      if (content === null) return `ERROR: cannot read "${p}".`
      if (find === '') return 'ERROR: "find" must not be empty.'
      const count = content.split(find).length - 1
      if (count === 0) return `ERROR: "find" not found in ${p}. read_file and copy an exact snippet.`
      if (count > 1) return `ERROR: "find" appears ${count}× in ${p}; add more surrounding context to make it unique.`
      const op: EditOp = { path: p, find, replace, applied: true }
      const existing = edits.findIndex((e) => e.path === p && e.find === find)
      if (existing >= 0) edits[existing] = op
      else edits.push(op)
      return `OK: recorded edit to ${p}.`
    }

    return `ERROR: unknown tool "${name}".`
  }

  const summary = await runToolLoop({
    ...cfg,
    system: SYSTEM,
    userMessage: request,
    tools: TOOLS,
    execute,
    maxSteps: 16,
  })

  const notes: string[] = []
  if (edits.length === 0) notes.push('The agent finished without recording any applicable edits.')

  return {
    summary: summary.trim() || '(no summary provided)',
    edits,
    notes,
    contextFiles: Array.from(visited),
  }
}
