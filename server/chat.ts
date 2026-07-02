import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Request, Response } from 'express'
import { getLlmSettings, getDecryptedApiKey, saveLlmSettings, writeAudit } from './db'
import { streamChat, type ChatMessage } from './llm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the logic guide once so the assistant is grounded in how the dashboard works.
let logicGuide = ''
try {
  logicGuide = fs.readFileSync(path.resolve(__dirname, '..', 'dashboard_logic_guide.md'), 'utf8')
} catch {
  logicGuide = '(dashboard_logic_guide.md not found)'
}

function buildSystemPrompt(dataSummary?: string): string {
  return [
    'You are the admin assistant for the Dallas Living Design Dashboard — a Perkins&Will tool that',
    'visualizes sustainability/wellness ("Living Design") metrics from an uploaded Excel project tracker.',
    'Answer questions about the dashboard accurately and concisely. Ground every answer about metrics,',
    'sectors, eligibility, or goals in the logic guide below; if the guide does not cover something, say so.',
    '',
    '=== DASHBOARD LOGIC GUIDE (source of truth) ===',
    logicGuide,
    dataSummary ? '\n=== CURRENT DASHBOARD DATA (this session) ===\n' + dataSummary : '',
  ].join('\n')
}

/** GET /api/admin/settings — current LLM settings (never returns the key). */
export async function getSettings(_req: Request, res: Response) {
  try {
    res.json(await getLlmSettings())
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load settings' })
  }
}

/** POST /api/admin/settings — save provider/model/apiKey (key encrypted at rest). */
export async function postSettings(req: Request, res: Response) {
  try {
    const { provider, model, apiKey } = req.body ?? {}
    if (provider !== 'anthropic' && provider !== 'openai') {
      return res.status(400).json({ error: 'provider must be "anthropic" or "openai"' })
    }
    const settings = await saveLlmSettings({ provider, model, apiKey })
    const email = (req as Request & { adminEmail?: string }).adminEmail
    await writeAudit(email, 'settings.update', { provider, model, keyChanged: !!apiKey })
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save settings' })
  }
}

/** POST /api/chat — streamed assistant reply (plain text chunks). */
export async function chat(req: Request, res: Response) {
  const { messages, dataSummary } = (req.body ?? {}) as {
    messages?: ChatMessage[]
    dataSummary?: string
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] is required' })
  }

  const settings = await getLlmSettings()
  const apiKey = await getDecryptedApiKey()
  if (!apiKey) {
    return res.status(400).json({ error: 'No API key configured. Add one in admin Settings.' })
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    for await (const chunk of streamChat({
      provider: settings.provider,
      apiKey,
      model: settings.model,
      system: buildSystemPrompt(dataSummary),
      messages,
    })) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM request failed'
    if (!res.headersSent) {
      res.status(502).json({ error: msg })
    } else {
      // Already streaming — surface the error inline and end.
      res.write(`\n\n[error: ${msg}]`)
      res.end()
    }
  }
}
