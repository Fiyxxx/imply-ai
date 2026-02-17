import type { JSX } from 'preact/compat'
import type { Message } from '../hooks/useChat'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'

interface DrawerProps {
  isOpen:      boolean
  title:       string
  position:    'bottom-right' | 'bottom-left'
  messages:    Message[]
  isStreaming: boolean
  error:       string | null
  onClose:     () => void
  onSend:      (text: string) => void
}

export function Drawer({
  isOpen,
  title,
  position,
  messages,
  isStreaming,
  error,
  onClose,
  onSend,
}: DrawerProps): JSX.Element {
  const cls = [
    'imply-drawer',
    isOpen ? 'open' : '',
    position === 'bottom-left' ? 'left' : '',
  ].filter(Boolean).join(' ')

  return (
    <div class={cls} aria-hidden={!isOpen}>
      {/* Header */}
      <div class="imply-header">
        <span class="imply-header-title">{title}</span>
        <div class="imply-header-actions">
          <button
            class="imply-header-btn"
            onClick={onClose}
            aria-label="Close chat"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <MessageList messages={messages} error={error} />

      <InputBar isStreaming={isStreaming} onSend={onSend} />
    </div>
  )
}
