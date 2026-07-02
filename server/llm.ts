import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

/**
 * Thin provider abstraction over the official Anthropic and OpenAI SDKs.
 * Given the admin's configured provider + BYO key, streams the assistant's
 * reply as plain text chunks. Runs server-side only — the key never leaves here.
 */

export type ChatRole = 'user' | 'assistant'
export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface StreamChatInput {
  provider: 'anthropic' | 'openai'
  apiKey: string
  model: string
  system: string
  messages: ChatMessage[]
}

/** Non-streaming: accumulate the whole reply (uses streaming under the hood to avoid timeouts). */
export async function completeChat(input: StreamChatInput): Promise<string> {
  let out = ''
  for await (const chunk of streamChat(input)) out += chunk
  return out
}

// --- Provider-agnostic tool-use loop (for the agentic code editor) ---

export interface AgentTool {
  name: string
  description: string
  /** JSON Schema object for the tool's arguments. */
  parameters: Record<string, unknown>
}
export type ToolExecutor = (name: string, args: Record<string, unknown>) => Promise<string>

export interface ToolLoopInput {
  provider: 'anthropic' | 'openai'
  apiKey: string
  model: string
  system: string
  userMessage: string
  tools: AgentTool[]
  execute: ToolExecutor
  maxSteps?: number
  onStep?: (note: string) => void
}

/**
 * Runs a native tool-use loop against either provider: the model calls tools
 * (search/read/edit), we execute them and feed results back, until it stops
 * calling tools and returns a final text answer. Returns that final text.
 */
export async function runToolLoop(input: ToolLoopInput): Promise<string> {
  const maxSteps = input.maxSteps ?? 12

  if (input.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: input.apiKey })
    const tools = input.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool.InputSchema,
    }))
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: input.userMessage }]
    for (let step = 0; step < maxSteps; step++) {
      const resp = await client.messages.create({
        model: input.model,
        max_tokens: 4096,
        system: input.system,
        tools,
        messages,
      })
      messages.push({ role: 'assistant', content: resp.content })
      const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (resp.stop_reason !== 'tool_use' || toolUses.length === 0) {
        return resp.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
      }
      const results: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        input.onStep?.(`${tu.name}(${JSON.stringify(tu.input).slice(0, 80)})`)
        const out = await input.execute(tu.name, tu.input as Record<string, unknown>)
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: out })
      }
      messages.push({ role: 'user', content: results })
    }
    return '(reached step limit without a final summary)'
  }

  // openai
  const client = new OpenAI({ apiKey: input.apiKey })
  const tools = input.tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
  const messages: any[] = [
    { role: 'system', content: input.system },
    { role: 'user', content: input.userMessage },
  ]
  for (let step = 0; step < maxSteps; step++) {
    const resp = await client.chat.completions.create({ model: input.model, messages, tools })
    const msg = resp.choices[0].message
    messages.push(msg)
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content || ''
    }
    for (const tc of msg.tool_calls) {
      if (tc.type !== 'function') continue
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch {
        /* leave empty */
      }
      input.onStep?.(`${tc.function.name}(${(tc.function.arguments || '').slice(0, 80)})`)
      const out = await input.execute(tc.function.name, args)
      messages.push({ role: 'tool', tool_call_id: tc.id, content: out })
    }
  }
  return '(reached step limit without a final summary)'
}

export async function* streamChat(input: StreamChatInput): AsyncGenerator<string> {
  if (input.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: input.apiKey })
    const stream = client.messages.stream({
      model: input.model,
      max_tokens: 4096,
      system: input.system,
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
    return
  }

  // openai
  const client = new OpenAI({ apiKey: input.apiKey })
  const stream = await client.chat.completions.create({
    model: input.model,
    stream: true,
    messages: [
      { role: 'system', content: input.system },
      ...input.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  })
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) yield delta
  }
}
