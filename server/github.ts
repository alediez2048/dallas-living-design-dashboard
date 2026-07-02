import type { EditOp } from './agent'

/**
 * GitHub integration for the publish flow (Phase 3 safety net).
 *
 * commitEdits: apply approved search/replace ops against the *live base branch*
 * content → commit to a new branch → open a PR (CI runs the build on it).
 * getChecks: read the PR's build-gate status. mergePR: merge once green.
 * rollbackTo: restore a previous tree with a new commit (non-destructive).
 *
 * Everything is scoped to GITHUB_REPO via a repo-scoped token.
 */

const API = 'https://api.github.com'

export function githubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_REPO
}
function repo(): string {
  const r = process.env.GITHUB_REPO
  if (!r) throw new Error('GITHUB_REPO is not set')
  return r
}
export function deployBranch(): string {
  return process.env.DEPLOY_BRANCH || 'feature/admin-chat-assistant'
}

async function gh(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${API}/repos/${repo()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(`GitHub ${method} ${path} → ${res.status}: ${data.message || text}`)
  return data
}

async function getBranchSha(branch: string): Promise<string> {
  const d = await gh('GET', `/git/ref/heads/${branch}`)
  return d.object.sha
}
async function getTreeSha(commitSha: string): Promise<string> {
  const d = await gh('GET', `/git/commits/${commitSha}`)
  return d.tree.sha
}
async function getFileContent(path: string, ref: string): Promise<string> {
  const d = await gh('GET', `/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(ref)}`)
  if (Array.isArray(d) || d.type !== 'file') throw new Error(`${path} is not a file`)
  return Buffer.from(d.content, 'base64').toString('utf8')
}
async function createBlob(content: string): Promise<string> {
  const d = await gh('POST', '/git/blobs', { content, encoding: 'utf-8' })
  return d.sha
}

export interface CommitResult {
  branch: string
  baseSha: string
  commitSha: string
  pr: { number: number; url: string; headSha: string }
}

/** Apply approved edits to the current base-branch content and open a PR. */
export async function commitEdits(edits: EditOp[], request: string, actorEmail?: string): Promise<CommitResult> {
  const applicable = edits.filter((e) => e.applied)
  if (applicable.length === 0) throw new Error('No applicable edits to commit')

  const base = deployBranch()
  const baseSha = await getBranchSha(base)
  const baseTree = await getTreeSha(baseSha)

  const byPath = new Map<string, EditOp[]>()
  for (const e of applicable) {
    const list = byPath.get(e.path) ?? []
    list.push(e)
    byPath.set(e.path, list)
  }

  const treeEntries: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = []
  for (const [p, ops] of byPath) {
    let content = await getFileContent(p, base)
    for (const op of ops) {
      if (!content.includes(op.find)) {
        throw new Error(`Edit no longer applies to ${p} (base branch changed since proposal). Re-propose.`)
      }
      content = content.replace(op.find, op.replace)
    }
    treeEntries.push({ path: p, mode: '100644', type: 'blob', sha: await createBlob(content) })
  }

  const newTree = (await gh('POST', '/git/trees', { base_tree: baseTree, tree: treeEntries })).sha
  const message = `AI edit: ${request}\n\nRequested by ${actorEmail || 'admin'} via the dashboard admin editor.`
  const commitSha = (await gh('POST', '/git/commits', { message, tree: newTree, parents: [baseSha] })).sha

  const branch = `agent/edit-${commitSha.slice(0, 8)}`
  await gh('POST', '/git/refs', { ref: `refs/heads/${branch}`, sha: commitSha })

  const pr = await gh('POST', '/pulls', {
    title: `AI edit: ${request.slice(0, 72)}`,
    head: branch,
    base,
    body: `Requested by ${actorEmail || 'admin'} via the dashboard admin editor.\n\n> ${request}`,
  })

  return { branch, baseSha, commitSha, pr: { number: pr.number, url: pr.html_url, headSha: pr.head.sha } }
}

export interface ChecksResult {
  state: 'success' | 'failure' | 'pending' | 'none'
  runs: { name: string; status: string; conclusion: string | null }[]
}

/** Build-gate status for a commit (GitHub Actions check runs). */
export async function getChecks(ref: string): Promise<ChecksResult> {
  const d = await gh('GET', `/commits/${ref}/check-runs`)
  const runs = (d.check_runs || []) as { name: string; status: string; conclusion: string | null }[]
  const simplified = runs.map((r) => ({ name: r.name, status: r.status, conclusion: r.conclusion }))
  if (runs.length === 0) return { state: 'none', runs: simplified }
  const failed = runs.some(
    (r) => r.status === 'completed' && r.conclusion && !['success', 'neutral', 'skipped'].includes(r.conclusion),
  )
  if (failed) return { state: 'failure', runs: simplified }
  const pending = runs.some((r) => r.status !== 'completed')
  return { state: pending ? 'pending' : 'success', runs: simplified }
}

/** Merge a PR into the deploy branch (squash). Returns the merge commit sha. */
export async function mergePR(number: number, headSha: string): Promise<{ merged: boolean; sha: string; baseShaBefore: string }> {
  const baseShaBefore = await getBranchSha(deployBranch())
  const d = await gh('PUT', `/pulls/${number}/merge`, { merge_method: 'squash', sha: headSha })
  return { merged: !!d.merged, sha: d.sha, baseShaBefore }
}

/** Roll the deploy branch back to a previous state by committing its old tree on top of HEAD. */
export async function rollbackTo(oldSha: string, reason: string): Promise<{ sha: string }> {
  const base = deployBranch()
  const currentSha = await getBranchSha(base)
  const oldTree = await getTreeSha(oldSha)
  const revert = (await gh('POST', '/git/commits', {
    message: `Rollback: ${reason}\n\nRestores tree from ${oldSha.slice(0, 8)}.`,
    tree: oldTree,
    parents: [currentSha],
  })).sha
  await gh('PATCH', `/git/refs/heads/${base}`, { sha: revert })
  return { sha: revert }
}
