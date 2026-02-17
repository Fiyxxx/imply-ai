# Actions CRUD — Design Document

**Date:** 2026-02-17
**Status:** Approved
**Approach:** Option A — Slide-in panel + OpenAPI import modal

---

## Overview

Actions are the "do things" layer of Imply. Where the RAG pipeline answers questions, Actions let the AI take real steps on behalf of the user — calling existing API endpoints in the customer's SaaS (create a ticket, look up an order, trigger a workflow). Admins define Actions in the dashboard; the AI picks the right one at runtime based on intent.

This build covers **define-only CRUD** — create, read, update, delete, and enable/disable actions — plus **OpenAPI spec import** so admins can bulk-import endpoints from an existing Swagger/OpenAPI spec rather than typing them all manually. Execution (AI triggering actions during chat) is a separate follow-up.

---

## 1. Data Model

### Schema change

Add a `parameters` Json column to the existing `Action` model:

```prisma
parameters  Json  @default("[]") @db.JsonB
```

`bodyTemplate` remains nullable and unused for now.

### Parameter element shape

```ts
interface ActionParameter {
  name:        string                          // e.g. "ticket_title"
  type:        'string' | 'number' | 'boolean'
  description: string                          // plain English, shown to LLM
  required:    boolean
}
```

**Example stored value:**
```json
[
  { "name": "title",    "type": "string",  "description": "Ticket subject",  "required": true  },
  { "name": "priority", "type": "string",  "description": "P1, P2, or P3",   "required": false }
]
```

---

## 2. API Layer

### `GET /api/projects/[id]/actions`
Returns all actions for the project. Excludes `headers` (contains credentials) from list response for safety. Includes: id, name, displayName, description, method, endpoint, enabled, requiresConfirmation, parameters, createdAt.

### `POST /api/projects/[id]/actions`
Creates a new action. Validates with Zod (see schema below). Enforces unique `(projectId, name)` constraint.

### `GET /api/projects/[id]/actions/[actionId]`
Fetch single action. **Includes `headers`** — needed to pre-fill the edit form.

### `PATCH /api/projects/[id]/actions/[actionId]`
Partial update. All fields optional. Same Zod schema but `.partial()`.

### `DELETE /api/projects/[id]/actions/[actionId]`
Hard delete. Returns `{ data: { success: true } }`.

### `POST /api/openapi-import`
Parses an OpenAPI 3.x or Swagger 2.x spec and returns candidate actions. Does **not** persist anything.

- Input: `{ url?: string, spec?: string }` — URL to fetch server-side, or raw JSON/YAML string
- Output: `{ data: CandidateAction[] }` where each item has: `name, displayName, description, method, endpoint, parameters`
- Server-side fetch avoids CORS issues
- Parsing: extract `paths`, map `operationId` → `name`, `summary` → `displayName`, `description` → `description`, path + method → `endpoint` + `method`, `parameters` + `requestBody.content.application/json.schema.properties` → `parameters[]`

### Zod validation schema

```ts
const ParameterSchema = z.object({
  name:        z.string().min(1).max(64),
  type:        z.enum(['string', 'number', 'boolean']),
  description: z.string().min(1).max(200),
  required:    z.boolean(),
})

const ActionSchema = z.object({
  name:                 z.string().regex(/^[a-z][a-z0-9_]*$/).max(64),
  displayName:          z.string().min(1).max(100),
  description:          z.string().min(1).max(500),
  method:               z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  endpoint:             z.string().url(),
  headers:              z.record(z.string()).default({}),
  parameters:           z.array(ParameterSchema).default([]),
  requiresConfirmation: z.boolean().default(false),
  enabled:              z.boolean().default(true),
})
```

---

## 3. UI Layer

### Sidebar

Add "Actions" nav item to `Sidebar.tsx` between Knowledge Base and Stats. Lightning-bolt icon. Route: `/dashboard/[projectId]/actions`.

### `/dashboard/[projectId]/actions/page.tsx` — list page

- Header: "Actions" title + "Import from OpenAPI" (outlined button) + "New action" (dark filled button)
- Table columns: Name / Method badge / Endpoint / Enabled toggle / Edit / Delete
- Enabled toggle → optimistic `PATCH { enabled }` on click
- Delete → inline row confirmation (row turns red, "Confirm delete" button appears) — no browser dialog
- Empty state: centered message + "Create your first action" CTA

### `components/dashboard/ActionPanel.tsx` — slide-in panel

Opens from the right, full height, ~560px wide. Used for both create and edit.

Five sections divided by horizontal rules:

| # | Section | Fields |
|---|---------|--------|
| 1 | Basic info | Display name, Internal name (auto-slugified, editable), Description (textarea) |
| 2 | HTTP config | Method (select), Endpoint URL |
| 3 | Headers | Key/value table, "Add header" link, delete per row |
| 4 | Parameters | Name / Type (select) / Description / Required (checkbox) table, "Add parameter" link |
| 5 | Behaviour | Require confirmation toggle, Enabled toggle |

Footer: Cancel + Save. Save disabled while loading.

Auto-slugify rule: display name → lowercase → replace spaces/special chars with `_` → strip leading non-alpha chars.

### `components/dashboard/OpenAPIImportModal.tsx` — 3-step modal

**Step 1 — Source**
- Text input: spec URL (fetched server-side)
- Or: paste raw JSON/YAML in textarea
- "Preview endpoints" → calls `POST /api/openapi-import`

**Step 2 — Select**
- Header: "N endpoints detected"
- "Select all" checkbox
- Scrollable checklist: method badge + path + summary per row
- "Import selected" button

**Step 3 — Import**
- Calls `POST /api/projects/[id]/actions` for each selected item sequentially
- Per-item status: spinner → checkmark (success) or ✕ (error)
- "Done" button closes modal and refreshes list

---

## 4. Error Handling

- Duplicate `name` on create/import: surface as field-level error ("Name already exists in this project")
- OpenAPI fetch failure (CORS, 404, timeout): shown in Step 1 below the URL input
- Malformed spec: "Could not parse spec. Ensure it is valid OpenAPI 3.x or Swagger 2.x JSON/YAML."
- Import partial failure: items that failed show ✕ with error message; successfully imported ones remain

---

## 5. Security Notes

- `headers` field (auth credentials) is **excluded from list `GET`** responses — only returned on single-item `GET` (edit form)
- Endpoint URL is validated with `z.string().url()` — must be a valid absolute URL
- Server-side OpenAPI fetch runs in the API route (not the browser), preventing SSRF to localhost/internal addresses — add a check to reject `localhost`, `127.0.0.1`, and RFC-1918 ranges before fetching

---

## Out of Scope (follow-up)

- Action execution during chat (LLM tool-use wiring)
- Secret management (encrypted headers, env variable references)
- Webhook signatures / HMAC verification
- Action execution log UI (the `ActionExecution` model exists but no UI yet)
