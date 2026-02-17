'use client'

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type JSX
} from 'react'
import { useParams } from 'next/navigation'
import type { APIResponse, DocumentSource } from '@/types/api'

interface Project {
  name: string
  apiKey: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: DocumentSource[]
  streaming?: boolean
}

interface ProjectData {
  id: string
  name: string
  apiKey: string
}

const SUGGESTIONS = [
  'What can you help me with?',
  'How do I get started?'
]

function LoadingDots(): JSX.Element {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default function PlaygroundPage(): JSX.Element {
  const params = useParams()
  const projectId = params['projectId'] as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [projectLoading, setProjectLoading] = useState<boolean>(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function fetchProject(): Promise<void> {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) {
          const body = (await res.json()) as APIResponse<ProjectData>
          throw new Error(body.error?.message ?? `Failed to load project (${res.status})`)
        }
        const body = (await res.json()) as APIResponse<ProjectData>
        if (!body.data) throw new Error('Project not found')
        setProject({ name: body.data.name, apiKey: body.data.apiKey })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setProjectLoading(false)
      }
    }
    void fetchProject()
  }, [projectId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewConversation = useCallback((): void => {
    setConversationId(null)
    setMessages([])
    setError(null)
    setInput('')
    textareaRef.current?.focus()
  }, [])

  const handleSend = useCallback(async (text?: string): Promise<void> => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading || project === null) return

    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)
    setError(null)
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Imply-Project-Key': project.apiKey
        },
        body: JSON.stringify({
          projectId,
          message: trimmed,
          ...(conversationId !== null && { conversationId })
        })
      })

      if (!res.ok || !res.body) {
        const body = (await res.json()) as APIResponse<never>
        throw new Error(body.error?.message ?? `Request failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          let event: {
            type: string
            text?: string
            data?: DocumentSource[]
            messageId?: string
            conversationId?: string
            message?: string
          }

          try {
            event = JSON.parse(jsonStr) as typeof event
          } catch {
            continue
          }

          if (event.type === 'error') {
            throw new Error(event.message ?? 'Stream error')
          } else if (event.type === 'delta' && event.text) {
            setMessages(prev => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + event.text }
              }
              return updated
            })
          } else if (event.type === 'sources' && event.data) {
            setMessages(prev => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  sources: event.data && event.data.length > 0 ? event.data : undefined
                }
              }
              return updated
            })
          } else if (event.type === 'done' && event.conversationId) {
            setConversationId(event.conversationId)
            setMessages(prev => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, streaming: false }
              }
              return updated
            })
          }
        }
      }

      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant' && last.streaming) {
          updated[updated.length - 1] = { ...last, streaming: false }
        }
        return updated
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = { role: 'assistant', content: `Error: ${errMsg}`, streaming: false }
        }
        return updated
      })
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [input, loading, project, projectId, conversationId])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSend()
      }
    },
    [handleSend]
  )

  if (projectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (error !== null && project === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm font-medium text-red-800">Failed to load playground</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">

      {/* Top-right actions */}
      <div className="flex justify-end px-2 py-3">
        {!isEmpty && (
          <button
            onClick={handleNewConversation}
            className="rounded-xl px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[var(--color-shell-200)] hover:text-gray-800"
          >
            New chat
          </button>
        )}
      </div>

      {/* Messages / empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* ── Empty state ── */
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 pb-4">
            <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              What can I help with?
            </h1>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void handleSend(s)}
                  disabled={project === null}
                  className="rounded-2xl px-4 py-3 text-sm text-gray-700 transition-colors disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-shell-200)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Message list ── */
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={
                      msg.role === 'user'
                        ? 'rounded-3xl rounded-tr-md bg-gray-900 px-4 py-3 text-sm text-white'
                        : 'rounded-3xl rounded-tl-md px-4 py-3 text-sm text-gray-900'
                    }
                    style={msg.role === 'assistant' ? { backgroundColor: 'var(--color-shell-50)' } : undefined}
                  >
                    {msg.content ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : msg.streaming ? (
                      <LoadingDots />
                    ) : null}
                    {msg.role === 'assistant' && msg.streaming && msg.content && (
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
                    )}
                  </div>

                  {/* Source pills */}
                  {msg.role === 'assistant' && !msg.streaming && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                      {msg.sources.map((src, si) => (
                        <span
                          key={si}
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs text-gray-500"
                          style={{ backgroundColor: 'var(--color-shell-200)' }}
                        >
                          {src.filename} · {src.score.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input card ── */}
      <div className="px-4 pb-6 pt-2">
        <div className="mx-auto max-w-2xl">
          {error !== null && project !== null && (
            <p className="mb-2 text-center text-xs text-red-500">{error}</p>
          )}

          <div
            className="rounded-3xl px-4 pt-3 pb-2 shadow-sm"
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-shell-200)'
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                // Auto-grow
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
              }}
              onKeyDown={handleKeyDown}
              disabled={loading || project === null}
              placeholder="Ask anything"
              className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: '1.5rem', maxHeight: '160px', overflow: 'hidden' }}
            />

            {/* Bottom row: icons + send */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Attachment */}
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[var(--color-shell-100)] hover:text-gray-600" disabled aria-label="Attach file">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                {/* Web */}
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[var(--color-shell-100)] hover:text-gray-600" disabled aria-label="Web search">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
                  </svg>
                </button>
                {/* Suggestions */}
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[var(--color-shell-100)] hover:text-gray-600" disabled aria-label="Suggestions">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </button>
              </div>

              {/* Send button */}
              <button
                onClick={() => void handleSend()}
                disabled={loading || !input.trim() || project === null}
                aria-label="Send"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-gray-400">
            AI can make mistakes. Please double-check responses.
          </p>
        </div>
      </div>
    </div>
  )
}
