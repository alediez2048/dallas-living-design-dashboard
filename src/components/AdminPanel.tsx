import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Settings as SettingsIcon, MessageSquare, Loader2, LogOut } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { useAdmin } from '../context/AdminContext'
import { useData } from '../context/DataContext'
import type { ProjectMetrics } from '../types'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

/** Compact, token-cheap summary of the loaded data so the assistant can answer data questions. */
function buildDataSummary(projects: ProjectMetrics[]): string {
  if (projects.length === 0) return 'No project data is currently loaded.'
  const bySector: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const years = new Set<number>()
  let eligible = 0
  for (const p of projects) {
    bySector[p.sector] = (bySector[p.sector] || 0) + 1
    byType[p.archVsInt] = (byType[p.archVsInt] || 0) + 1
    years.add(p.reportingYear)
    if (p.isEligible) eligible++
  }
  const fmt = (o: Record<string, number>) =>
    Object.entries(o)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  return [
    `Total projects: ${projects.length} (eligible: ${eligible}).`,
    `Reporting years: ${Array.from(years).sort((a, b) => b - a).join(', ')}.`,
    `By sector — ${fmt(bySector)}.`,
    `By type — ${fmt(byType)}.`,
  ].join('\n')
}

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { adminFetch } = useAdmin()
  const { projects } = useData()
  const { signOut } = useClerk()
  const [tab, setTab] = useState<'chat' | 'settings'>('chat')

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#171717] border-l border-gray-200 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === 'chat'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <MessageSquare size={15} /> Chat
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === 'settings'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <SettingsIcon size={15} /> Settings
          </button>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
          <X size={18} />
        </button>
      </div>

      {tab === 'chat' ? (
        <ChatTab adminFetch={adminFetch} dataSummary={buildDataSummary(projects)} />
      ) : (
        <SettingsTab adminFetch={adminFetch} />
      )}

      <button
        onClick={() => void signOut()}
        className="flex items-center justify-center gap-2 py-2.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-t border-gray-200 dark:border-white/10"
      >
        <LogOut size={13} /> Sign out of admin
      </button>
    </div>
  )
}

function ChatTab({
  adminFetch,
  dataSummary,
}: {
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>
  dataSummary: string
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    const nextMessages: ChatMsg[] = [...messages, { role: 'user', content: text }]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setBusy(true)
    try {
      const res = await adminFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, dataSummary }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: `⚠️ ${err.error || 'Request failed'}` }
          return copy
        })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: acc }
          return copy
        })
      }
    } catch {
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: '⚠️ Network error' }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }, [input, busy, messages, adminFetch, dataSummary])

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-gray-400 dark:text-gray-500 text-center mt-8">
            Ask about the dashboard — how metrics are calculated, sector breakdowns, eligibility rules, or the
            current data.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200'
              }`}
            >
              {m.content || <Loader2 size={14} className="animate-spin" />}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={1}
          placeholder="Ask a question…"
          className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-32"
        />
        <button
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          className="px-3 rounded-xl bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-500"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </>
  )
}

function SettingsTab({
  adminFetch,
}: {
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>
}) {
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await adminFetch('/api/admin/settings')
        if (res.ok) {
          const s = await res.json()
          setProvider(s.provider)
          setModel(s.model)
          setHasApiKey(s.hasApiKey)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [adminFetch])

  const save = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey: apiKey || undefined }),
      })
      if (res.ok) {
        const s = await res.json()
        setModel(s.model)
        setHasApiKey(s.hasApiKey)
        setApiKey('')
        setStatus('Saved ✓')
      } else {
        const e = await res.json().catch(() => ({}))
        setStatus(e.error || 'Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
      <div>
        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1.5">Provider</label>
        <div className="flex gap-2">
          {(['anthropic', 'openai'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProvider(p)
                setModel('')
              }}
              className={`flex-1 py-2 rounded-lg border capitalize ${
                provider === p
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1.5">Model</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={provider === 'anthropic' ? 'claude-opus-4-8' : 'gpt-4o'}
          className="w-full rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-400 mt-1">Leave blank to use the provider default.</p>
      </div>

      <div>
        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          API key {hasApiKey && <span className="text-emerald-500 text-xs">(configured)</span>}
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasApiKey ? '•••••••• (leave blank to keep)' : 'sk-…'}
          className="w-full rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Stored encrypted server-side. Never exposed to the browser.
        </p>
      </div>

      <button
        onClick={() => void save()}
        disabled={saving}
        className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
      {status && <p className="text-center text-sm text-gray-500 dark:text-gray-400">{status}</p>}
    </div>
  )
}
