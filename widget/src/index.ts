import { render, h } from 'preact'
import { useState, useCallback }  from 'preact/hooks'
import type { JSX }               from 'preact/compat'
import { STYLES }                 from './styles'
import { Bubble }                 from './components/Bubble'
import { Drawer }                 from './components/Drawer'
import { useChat }                from './hooks/useChat'

// ---- Types -----------------------------------------------------------------

interface ImplyConfig {
  apiKey:      string
  projectId:   string
  title?:      string
  position?:   'bottom-right' | 'bottom-left'
  onNavigate?: (url: string) => void
}

declare global {
  interface Window {
    ImplyConfig?: ImplyConfig
    Imply?: {
      open:    () => void
      close:   () => void
      destroy: () => void
    }
  }
}

// ---- Root component --------------------------------------------------------

// Module-level reference so Widget can expose destroy() cleanly
let rootContainer: HTMLElement | null = null

function Widget({ config }: { config: ImplyConfig }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

  const { messages, isStreaming, error, sendMessage } = useChat({
    apiKey:      config.apiKey,
    projectId:   config.projectId,
    baseUrl:     '', // same origin
    onNavigate:  config.onNavigate,
  })

  const open    = useCallback(() => setIsOpen(true), [])
  const close   = useCallback(() => setIsOpen(false), [])
  const toggle  = useCallback(() => setIsOpen(o => !o), [])

  // Expose public API
  window.Imply = {
    open,
    close,
    destroy: () => { rootContainer?.remove() },
  }

  return h(
    'div' as unknown as 'div',
    { style: 'display:contents' },
    h(Bubble, {
      isOpen,
      position: config.position ?? 'bottom-right',
      onToggle: toggle,
    }),
    h(Drawer, {
      isOpen,
      title:       config.title ?? 'Imply',
      position:    config.position ?? 'bottom-right',
      messages,
      isStreaming,
      error,
      onClose:     close,
      onSend:      sendMessage,
    })
  ) as JSX.Element
}

// ---- Mount -----------------------------------------------------------------

const cfg = window.ImplyConfig

if (!cfg?.apiKey || !cfg?.projectId) {
  console.warn('[Imply] missing apiKey or projectId in window.ImplyConfig')
} else {
  rootContainer = document.createElement('div')
  rootContainer.id = 'imply-root'
  document.body.appendChild(rootContainer)

  const shadow = rootContainer.attachShadow({ mode: 'open' })

  const style       = document.createElement('style')
  style.textContent = STYLES
  shadow.appendChild(style)

  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  render(h(Widget, { config: cfg }), mountPoint)
}
