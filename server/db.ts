import pg from 'pg'
import { encryptSecret, decryptSecret } from './crypto'

/**
 * Postgres access layer (Railway injects DATABASE_URL).
 * Holds admin LLM provider settings (with the BYO API key encrypted at rest).
 * The audit_log table is created now for Phase 3 use.
 */

const { Pool } = pg

let pool: pg.Pool | null = null

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')
    pool = new Pool({
      connectionString,
      // Railway Postgres accepts SSL; relax verification for the managed cert.
      ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
    })
  }
  return pool
}

let initialized = false

export async function initDb(): Promise<void> {
  if (initialized) return
  const client = getPool()
  await client.query(`
    CREATE TABLE IF NOT EXISTS llm_settings (
      id            SMALLINT PRIMARY KEY DEFAULT 1,
      provider      TEXT NOT NULL DEFAULT 'anthropic',
      model         TEXT NOT NULL DEFAULT '',
      api_key_enc   TEXT,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT single_row CHECK (id = 1)
    );
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          BIGSERIAL PRIMARY KEY,
      actor_email TEXT,
      action      TEXT NOT NULL,
      detail      JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  initialized = true
}

export interface LlmSettings {
  provider: 'anthropic' | 'openai'
  model: string
  hasApiKey: boolean
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-opus-4-8',
  openai: 'gpt-4o',
}

/** Public settings (never returns the key). */
export async function getLlmSettings(): Promise<LlmSettings> {
  await initDb()
  const { rows } = await getPool().query(
    'SELECT provider, model, api_key_enc FROM llm_settings WHERE id = 1',
  )
  if (rows.length === 0) {
    return { provider: 'anthropic', model: DEFAULT_MODELS.anthropic, hasApiKey: false }
  }
  const row = rows[0]
  return {
    provider: row.provider,
    model: row.model || DEFAULT_MODELS[row.provider] || '',
    hasApiKey: !!row.api_key_enc,
  }
}

/** Internal: returns the decrypted key for server-side LLM calls. */
export async function getDecryptedApiKey(): Promise<string | null> {
  await initDb()
  const { rows } = await getPool().query('SELECT api_key_enc FROM llm_settings WHERE id = 1')
  const enc = rows[0]?.api_key_enc
  return enc ? decryptSecret(enc) : null
}

export async function saveLlmSettings(input: {
  provider: 'anthropic' | 'openai'
  model?: string
  apiKey?: string
}): Promise<LlmSettings> {
  await initDb()
  const model = input.model?.trim() || DEFAULT_MODELS[input.provider] || ''
  // Only overwrite the key when a new one is provided (blank = keep existing).
  const apiKeyEnc = input.apiKey && input.apiKey.trim() ? encryptSecret(input.apiKey.trim()) : null
  await getPool().query(
    `INSERT INTO llm_settings (id, provider, model, api_key_enc, updated_at)
     VALUES (1, $1, $2, COALESCE($3, (SELECT api_key_enc FROM llm_settings WHERE id = 1)), now())
     ON CONFLICT (id) DO UPDATE SET
       provider = EXCLUDED.provider,
       model = EXCLUDED.model,
       api_key_enc = COALESCE($3, llm_settings.api_key_enc),
       updated_at = now()`,
    [input.provider, model, apiKeyEnc],
  )
  return getLlmSettings()
}

export async function writeAudit(actorEmail: string | undefined, action: string, detail?: unknown) {
  try {
    await initDb()
    await getPool().query('INSERT INTO audit_log (actor_email, action, detail) VALUES ($1, $2, $3)', [
      actorEmail ?? null,
      action,
      detail ? JSON.stringify(detail) : null,
    ])
  } catch (err) {
    console.error('[audit] failed to write', err)
  }
}
