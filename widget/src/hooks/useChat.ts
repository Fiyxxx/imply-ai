import { useState, useCallback, useRef } from 'preact/hooks'

export interface DocumentSource {
  filename: string
  score:    number
}

export interface Message {
  id:       string
  role:     'user' | 'assistant'
  content:  string
  sources?: DocumentSource[]
  isTyping?: boolean
}

type ActionEvent =
  | { kind: 'navigate'; url: string }
  | { kind: 'open_tab'; url: string }
  | { kind: 'http';     name: string; requiresConfirmation: boolean }

type SSEEvent =
  | { type: 'sources'; data: DocumentSource[] }
  | { type: 'delta';   text: string }
  | { type: 'done';    messageId: string; conversationId: string }
  | { type: 'action';  action: ActionEvent }
  | { type: 'error';   message: string }

/** Exported for testing */
export function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith('data: ')) return null
  try {
    return JSON.parse(line.slice(6)) as SSEEvent
  } catch {
    return null
  }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export interface ChatConfig {
  apiKey:      string
  projectId:   string
  baseUrl:     string
  onNavigate?: (url: string) => void
}

export function useChat(config: ChatConfig) {
  const [messages,    setMessages]    = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const conversationIdRef             = useRef<string | null>(
    sessionStorage.getItem(`imply-conv-${config.projectId}`)
  )

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (isStreaming || !text.trim()) return
    setError(null)
    setIsStreaming(true)

    // Add user message
    const userMsg: Message = { id: generateId(), role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])

    // Add typing placeholder
    const assistantId = generateId()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isTyping: true }])

    try {
      const res = await fetch(`${config.baseUrl}/api/chat`, {
        method:  'POST',
        headers: {
          'Content-Type':        'application/json',
          'X-Imply-Project-Key': config.apiKey,
        },
        body: JSON.stringify({
          projectId:      config.projectId,
          message:        text.trim(),
          conversationId: conversationIdRef.current ?? undefined,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   sources: DocumentSource[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const event = parseSSELine(line.trim())
          if (!event) continue

          if (event.type === 'sources') {
            sources = event.data
          } else if (event.type === 'delta') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + event.text, isTyping: false }
                : m
            ))
          } else if (event.type === 'done') {
            conversationIdRef.current = event.conversationId
            sessionStorage.setItem(`imply-conv-${config.projectId}`, event.conversationId)
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, sources, isTyping: false } : m
            ))
          } else if (event.type === 'action') {
            dispatchAction(event.action, config.onNavigate)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.'
      setError(msg)
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, config])

  return { messages, isStreaming, error, sendMessage }
}

function dispatchAction(
  action: ActionEvent,
  onNavigate?: (url: string) => void
): void {
  if (action.kind === 'navigate') {
    if (onNavigate) {
      onNavigate(action.url)
    } else {
      window.location.href = action.url
    }
  } else if (action.kind === 'open_tab') {
    window.open(action.url, '_blank', 'noopener,noreferrer')
  }
  // 'http' kind handled in follow-up (action execution feature)
}
