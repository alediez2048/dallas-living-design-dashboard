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
