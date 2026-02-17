import { useEffect, useRef, type JSX } from 'preact/compat'
import type { Message } from '../hooks/useChat'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  messages: Message[]
  error:    string | null
}

export function MessageList({ messages, error }: MessageListProps): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div class="imply-messages">
      {messages.length === 0 && (
        <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', marginTop: '32px' }}>
          Ask me anything about this product.
        </p>
      )}

      {messages.map(m => (
        <MessageItem key={m.id} message={m} />
      ))}

      {error !== null && (
        <div class="imply-error">{error}</div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
