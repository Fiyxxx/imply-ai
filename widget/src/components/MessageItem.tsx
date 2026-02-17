import { useState, type JSX } from 'preact/compat'
import type { Message } from '../hooks/useChat'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps): JSX.Element {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  if (message.isTyping) {
    return (
      <div class="imply-msg assistant">
        <div class="imply-msg-bubble">
          <div class="imply-typing">
            <span /><span /><span />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div class={`imply-msg ${message.role}`}>
      <div class="imply-msg-bubble">{message.content}</div>

      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
        <div
          class="imply-sources"
          onClick={() => setSourcesOpen(o => !o)}
        >
          {sourcesOpen ? '▾' : '▸'} {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
          {sourcesOpen && (
            <div class="imply-sources-list">
              {message.sources.map((s, i) => (
                <div key={i} class="imply-source-item">{s.filename}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
