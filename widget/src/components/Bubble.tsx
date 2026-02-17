import { useEffect, useRef, type JSX } from 'preact/compat'

interface BubbleProps {
  isOpen:   boolean
  position: 'bottom-right' | 'bottom-left'
  onToggle: () => void
}

export function Bubble({ isOpen, position, onToggle }: BubbleProps): JSX.Element {
  const btnRef  = useRef<HTMLButtonElement>(null)
  const pulsed  = useRef(false)

  useEffect(() => {
    if (!pulsed.current && btnRef.current) {
      btnRef.current.classList.add('pulse')
      pulsed.current = true
    }
  }, [])

  const cls = [
    'imply-bubble',
    position === 'bottom-left' ? 'left' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={btnRef}
      class={cls}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      onClick={onToggle}
    >
      {isOpen ? (
        // X icon
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        // Lightning bolt icon
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )}
    </button>
  )
}
