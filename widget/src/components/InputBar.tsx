import { useState, useRef, type JSX } from 'preact/compat'

interface InputBarProps {
  isStreaming: boolean
  onSend:      (text: string) => void
}

export function InputBar({ isStreaming, onSend }: InputBarProps): JSX.Element {
  const [value, setValue] = useState('')
  const ref               = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit(): void {
    const text = value.trim()
    if (!text || isStreaming) return
    onSend(text)
    setValue('')
    // Reset height
    if (ref.current) ref.current.style.height = 'auto'
  }

  function handleInput(e: Event): void {
    const ta = e.currentTarget as HTMLTextAreaElement
    setValue(ta.value)
    // Auto-grow
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`
  }

  return (
    <div class="imply-input-bar">
      <textarea
        ref={ref}
        class="imply-textarea"
        placeholder="Type a message..."
        value={value}
        disabled={isStreaming}
        rows={1}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
      <button
        class="imply-send-btn"
        disabled={isStreaming || !value.trim()}
        onClick={submit}
        aria-label="Send"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </button>
    </div>
  )
}
