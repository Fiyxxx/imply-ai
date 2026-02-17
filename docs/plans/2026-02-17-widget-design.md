# Widget — Design Document

**Date:** 2026-02-17
**Status:** Approved

---

## Overview

The Imply widget is a self-contained embeddable chat interface that SaaS customers drop into their product via two script tags. It provides a floating bubble that opens a slide-up drawer, streams AI responses from the `/api/chat` endpoint, and can execute browser actions (navigate, open tab) in addition to the existing server-side HTTP actions.

---

## 1. Architecture

### Approach
Separate `widget/` package at the repo root with its own `package.json`, Vite config, and TypeScript config. Built with **Vite (library mode) + Preact** — gives React-style component authoring at ~3KB runtime cost, well under the 100KB gzipped target.

### Directory structure

```
widget/
├── package.json          # preact, vite (devDep only)
├── vite.config.ts        # lib mode → ../../public/widget.js
├── tsconfig.json         # strict, jsx: preact
└── src/
    ├── index.ts          # entry point — reads ImplyConfig, mounts widget
    ├── components/
    │   ├── Bubble.tsx    # floating toggle button
    │   ├── Drawer.tsx    # slide-up panel container
    │   ├── MessageList.tsx
    │   ├── MessageItem.tsx
    │   └── InputBar.tsx
    ├── hooks/
    │   └── useChat.ts    # SSE streaming, message state, action dispatch
    └── styles.ts         # CSS string injected into shadow DOM
```

### Build integration
Root `package.json` gets a `build:widget` script:
```bash
pnpm --filter widget build   # outputs public/widget.js
```

In development, `public/widget.js` is served by Next.js at `/widget.js`.

### Style isolation
The widget mounts into `<div id="imply-root">` using a **shadow DOM root**. This prevents the customer's CSS from leaking in and the widget's styles from leaking out. All styles are injected as a `<style>` tag inside the shadow root at mount time.

---

## 2. Customer Integration

### Embed code
```html
<script>
  window.ImplyConfig = {
    apiKey:    'pk_live_abc123',   // required — from Agent settings page
    projectId: 'uuid-here',        // required

    // optional:
    title:      'Support Chat',    // drawer header title (default: 'Imply')
    position:   'bottom-right',    // or 'bottom-left' (default: 'bottom-right')
    onNavigate: (path) => router.push(path)  // SPA navigation hook
  }
</script>
<script src="https://your-domain.com/widget.js" async></script>
```

### Startup sequence (`index.ts`)
1. Read `window.ImplyConfig`
2. If `apiKey` or `projectId` missing → `console.warn('[Imply] missing apiKey or projectId')` and exit silently — never throw on the customer's page
3. Create `<div id="imply-root">`, append to `document.body`
4. Attach shadow root, inject `<style>`
5. Render `<Bubble />` + `<Drawer />` via Preact
6. Expose public API: `window.Imply = { open, close, destroy }`

### Public JS API
```javascript
window.Imply.open()     // programmatically open the drawer
window.Imply.close()    // close it
window.Imply.destroy()  // unmount and remove from DOM entirely
```

---

## 3. UI Components

### Bubble
- Fixed position, bottom-right (or bottom-left), 56×56px circle
- Black background, white lightning bolt SVG icon
- Subtle pulse animation on first load (CSS `@keyframes`)
- Clicking toggles drawer; icon swaps to X when drawer is open

### Drawer
- Slides up from the corner (CSS `transform: translateY` transition, 250ms ease-out)
- Desktop: 380px wide × 560px tall
- Mobile (< 640px): full-width, 65% viewport height
- Structure:
  ```
  ┌─────────────────────────────────┐
  │  Title              [–]  [×]   │  ← black header, white text
  ├─────────────────────────────────┤
  │                                 │
  │     message bubbles scroll      │  ← MessageList
  │                                 │
  ├─────────────────────────────────┤
  │  [Type a message...    ]  [▶]  │  ← InputBar
  └─────────────────────────────────┘
  ```

### MessageItem
- **User:** right-aligned, black pill, white text
- **Assistant:** left-aligned, eggshell (`#f5f0eb`) background, streams in token-by-token
- **Typing indicator:** three animated dots while waiting for first token
- **Sources chip:** collapsed "N sources" below assistant messages, expands on click to show filenames

### InputBar
- `<textarea>` auto-grows up to 4 lines
- Enter → send, Shift+Enter → newline
- Disabled while a response is streaming (one message at a time)

---

## 4. Chat & Streaming Logic

### SSE contract

**Existing events** (no change):
```
{ type: 'sources', data: DocumentSource[] }
{ type: 'delta',   text: string }
{ type: 'done',    messageId: string, conversationId: string }
{ type: 'error',   message: string }
```

**New event** added to `/api/chat`:
```
{ type: 'action', action: ActionEvent }
```

where `ActionEvent` is one of:
```typescript
| { kind: 'navigate';  url: string }
| { kind: 'open_tab';  url: string }
| { kind: 'http';      name: string; requiresConfirmation: boolean }
```

### Browser action execution (widget-side)

| kind | Widget behaviour |
|---|---|
| `navigate` | Calls `ImplyConfig.onNavigate(url)` if provided, else `window.location.href = url` |
| `open_tab` | `window.open(url, '_blank', 'noopener,noreferrer')` |
| `http` | Shows inline confirmation UI if `requiresConfirmation: true`; HTTP execution wired in follow-up |

### `useChat` hook state
```typescript
interface ChatState {
  messages:       Message[]
  isStreaming:    boolean
  conversationId: string | null
  error:          string | null
}
```

### Conversation persistence
`conversationId` stored in `sessionStorage` keyed by `projectId`. Same thread is maintained across in-app navigation; refreshing the page (or closing the tab) starts a new conversation.

---

## 5. API changes required

### CORS
`/api/chat` must add `Access-Control-Allow-Origin: *` (or restrict to customer domains) so the widget can call it from any hostname.

### New `action` SSE event
`/api/chat` route parses action suggestions from the LLM response and emits `{ type: 'action', action: { kind, ... } }` before the `done` event.

---

## 6. Error Handling

| Scenario | Widget behaviour |
|---|---|
| Missing `apiKey` / `projectId` | Silent `console.warn`, no widget mounted |
| Network error on send | Inline error message in chat: "Something went wrong. Try again." |
| Stream interrupted mid-response | Partial text displayed, error appended below |
| Action `navigate` with no `onNavigate` | Falls back to `window.location.href` |
| `open_tab` blocked by popup blocker | Silently ignored (browser handles it) |

---

## 7. Out of Scope (follow-up)

- HTTP action execution from the widget (server-side call, confirm UI)
- npm package (`@imply/widget`)
- Widget theming/customization beyond `title` and `position`
- Unread message badge on the bubble
- Widget analytics (open rate, message count)
- CSAT thumbs up/down on messages
