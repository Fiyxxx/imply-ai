# Actions CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full Actions CRUD feature — API, slide-in panel UI, and OpenAPI spec import — so admins can define HTTP actions the AI can execute during chat.

**Architecture:** REST API routes under `/api/projects/[id]/actions` + a separate `/api/openapi-import` parser endpoint. The UI is a list page at `/dashboard/[projectId]/actions` with a right-side slide-in panel for create/edit and a 3-step modal for OpenAPI import. A `parameters` Json column is added to the `Action` model for structured parameter definitions.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Zod 4, TypeScript strict, Tailwind CSS, Vitest

---

## Task 1: Add `parameters` column to Action schema and migrate

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add the column**

In `prisma/schema.prisma`, find the `Action` model and add `parameters` after `bodyTemplate`:

```prisma
bodyTemplate          String?     @map("body_template") @db.Text // Request body template
parameters            Json        @default("[]") @db.JsonB
```

**Step 2: Run migration**

```bash
pnpm prisma migrate dev --name add_action_parameters
```

Expected: new migration file created in `prisma/migrations/`, Prisma client regenerated.

**Step 3: Verify**

```bash
pnpm prisma studio
```

Open the Action table and confirm the `parameters` column exists (or just check `prisma/migrations/` for the new migration file).

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add parameters Json column to Action model"
```

---

## Task 2: Add Action types to `types/api.ts`

**Files:**
- Modify: `types/api.ts`

**Step 1: Add types**

Append to `types/api.ts`:

```typescript
export interface ActionParameter {
  name:        string
  type:        'string' | 'number' | 'boolean'
  description: string
  required:    boolean
}

export interface ActionItem {
  id:                   string
  name:                 string
  displayName:          string
  description:          string
  method:               'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint:             string
  parameters:           ActionParameter[]
  requiresConfirmation: boolean
  enabled:              boolean
  createdAt:            string
}

export interface ActionDetail extends ActionItem {
  headers: Record<string, string>
}

export interface CandidateAction {
  name:        string
  displayName: string
  description: string
  method:      'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint:    string
  parameters:  ActionParameter[]
}
```

**Step 2: Commit**

```bash
git add types/api.ts
git commit -m "feat: add Action types to api.ts"
```

---

## Task 3: Add Action Zod schemas to `lib/validations.ts`

**Files:**
- Modify: `lib/validations.ts`

**Step 1: Add schemas**

Append to `lib/validations.ts`:

```typescript
export const ActionParameterSchema = z.object({
  name:        z.string().min(1).max(64),
  type:        z.enum(['string', 'number', 'boolean']),
  description: z.string().min(1).max(200),
  required:    z.boolean(),
})

export const CreateActionSchema = z.object({
  name:                 z.string().regex(/^[a-z][a-z0-9_]*$/, {
    message: 'Name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores'
  }).max(64),
  displayName:          z.string().min(1).max(100),
  description:          z.string().min(1).max(500),
  method:               z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  endpoint:             z.string().url(),
  headers:              z.record(z.string(), z.string()).default({}),
  parameters:           z.array(ActionParameterSchema).default([]),
  requiresConfirmation: z.boolean().default(false),
  enabled:              z.boolean().default(true),
})

export const UpdateActionSchema = CreateActionSchema.partial()

export const OpenAPIImportSchema = z.object({
  url:  z.string().url().optional(),
  spec: z.string().min(1).optional(),
}).refine(data => data.url !== undefined || data.spec !== undefined, {
  message: 'Either url or spec must be provided'
})

export type CreateActionRequest = z.infer<typeof CreateActionSchema>
export type UpdateActionRequest = z.infer<typeof UpdateActionSchema>
export type OpenAPIImportRequest = z.infer<typeof OpenAPIImportSchema>
```

**Step 2: Commit**

```bash
git add lib/validations.ts
git commit -m "feat: add Action Zod schemas to validations"
```

---

## Task 4: Create actions collection API route

**Files:**
- Create: `app/api/projects/[id]/actions/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { db } from '@/lib/db'
import { ImplyError, NotFoundError } from '@/lib/errors'
import { CreateActionSchema } from '@/lib/validations'

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: 'Validation error', code: 'VALIDATION_ERROR', metadata: { issues: error.issues } } },
      { status: 400 }
    )
  }
  if (error instanceof ImplyError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code, metadata: error.metadata } },
      { status: error.statusCode }
    )
  }
  console.error('Actions API error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const project = await db.project.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!project) throw new NotFoundError('Project')

    const actions = await db.action.findMany({
      where: { projectId: id },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        method: true,
        endpoint: true,
        parameters: true,
        requiresConfirmation: true,
        enabled: true,
        createdAt: true,
        // headers intentionally excluded from list (contains credentials)
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ data: actions })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await req.json()
    const validated = CreateActionSchema.parse(body)

    const project = await db.project.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!project) throw new NotFoundError('Project')

    // Check unique (projectId, name)
    const existing = await db.action.findUnique({
      where: { projectId_name: { projectId: id, name: validated.name } },
      select: { id: true }
    })
    if (existing) {
      return NextResponse.json(
        { error: { message: `An action named '${validated.name}' already exists in this project`, code: 'CONFLICT' } },
        { status: 409 }
      )
    }

    const action = await db.action.create({
      data: {
        projectId:            id,
        name:                 validated.name,
        displayName:          validated.displayName,
        description:          validated.description,
        method:               validated.method,
        endpoint:             validated.endpoint,
        headers:              validated.headers,
        parameters:           validated.parameters,
        requiresConfirmation: validated.requiresConfirmation,
        enabled:              validated.enabled,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        method: true,
        endpoint: true,
        parameters: true,
        requiresConfirmation: true,
        enabled: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ data: action }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
```

**Step 2: Commit**

```bash
git add app/api/projects/[id]/actions/route.ts
git commit -m "feat: add GET and POST actions collection route"
```

---

## Task 5: Create actions single-resource API route

**Files:**
- Create: `app/api/projects/[id]/actions/[actionId]/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { db } from '@/lib/db'
import { ImplyError, NotFoundError } from '@/lib/errors'
import { UpdateActionSchema } from '@/lib/validations'

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: 'Validation error', code: 'VALIDATION_ERROR', metadata: { issues: error.issues } } },
      { status: 400 }
    )
  }
  if (error instanceof ImplyError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code, metadata: error.metadata } },
      { status: error.statusCode }
    )
  }
  console.error('Actions [actionId] API error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

type RouteContext = { params: Promise<{ id: string; actionId: string }> }

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { id, actionId } = await params

    const action = await db.action.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        method: true,
        endpoint: true,
        headers: true, // included for edit form pre-fill
        parameters: true,
        requiresConfirmation: true,
        enabled: true,
        createdAt: true,
        projectId: true,
      }
    })

    if (!action || action.projectId !== id) throw new NotFoundError('Action')

    return NextResponse.json({ data: action })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { id, actionId } = await params
    const body = await req.json()
    const updates = UpdateActionSchema.parse(body)

    const existing = await db.action.findUnique({
      where: { id: actionId },
      select: { id: true, projectId: true, name: true }
    })
    if (!existing || existing.projectId !== id) throw new NotFoundError('Action')

    // If renaming, check new name is unique
    if (updates.name !== undefined && updates.name !== existing.name) {
      const conflict = await db.action.findUnique({
        where: { projectId_name: { projectId: id, name: updates.name } },
        select: { id: true }
      })
      if (conflict) {
        return NextResponse.json(
          { error: { message: `An action named '${updates.name}' already exists in this project`, code: 'CONFLICT' } },
          { status: 409 }
        )
      }
    }

    const action = await db.action.update({
      where: { id: actionId },
      data: {
        ...(updates.name                 !== undefined && { name: updates.name }),
        ...(updates.displayName          !== undefined && { displayName: updates.displayName }),
        ...(updates.description          !== undefined && { description: updates.description }),
        ...(updates.method               !== undefined && { method: updates.method }),
        ...(updates.endpoint             !== undefined && { endpoint: updates.endpoint }),
        ...(updates.headers              !== undefined && { headers: updates.headers }),
        ...(updates.parameters           !== undefined && { parameters: updates.parameters }),
        ...(updates.requiresConfirmation !== undefined && { requiresConfirmation: updates.requiresConfirmation }),
        ...(updates.enabled              !== undefined && { enabled: updates.enabled }),
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        method: true,
        endpoint: true,
        headers: true,
        parameters: true,
        requiresConfirmation: true,
        enabled: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ data: action })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { id, actionId } = await params

    const existing = await db.action.findUnique({
      where: { id: actionId },
      select: { id: true, projectId: true }
    })
    if (!existing || existing.projectId !== id) throw new NotFoundError('Action')

    await db.action.delete({ where: { id: actionId } })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return errorResponse(error)
  }
}
```

**Step 2: Commit**

```bash
git add app/api/projects/[id]/actions/[actionId]/route.ts
git commit -m "feat: add GET, PATCH, DELETE actions single-resource route"
```

---

## Task 6: Create OpenAPI parser utility + test

**Files:**
- Create: `lib/openapi-parser.ts`
- Create: `lib/openapi-parser.test.ts`

**Step 1: Write the failing test first**

```typescript
// lib/openapi-parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseOpenAPISpec } from './openapi-parser'

const MINIMAL_SPEC = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/tickets': {
      post: {
        operationId: 'create_ticket',
        summary: 'Create a support ticket',
        description: 'Creates a new support ticket',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title:    { type: 'string',  description: 'Ticket title' },
                  priority: { type: 'string',  description: 'P1, P2, or P3' },
                  urgent:   { type: 'boolean', description: 'Mark as urgent' },
                }
              }
            }
          }
        }
      }
    },
    '/tickets/{id}': {
      get: {
        operationId: 'get_ticket',
        summary: 'Get a ticket',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Ticket ID' }
        ]
      }
    }
  }
}

describe('parseOpenAPISpec', () => {
  it('extracts candidate actions from a valid OpenAPI 3 spec', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    expect(result).toHaveLength(2)
  })

  it('maps operationId to name (slugified)', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.name).toBe('create_ticket')
  })

  it('maps summary to displayName', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.displayName).toBe('Create a support ticket')
  })

  it('builds full endpoint URL from server + path', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.endpoint).toBe('https://api.example.com/tickets')
  })

  it('extracts requestBody properties as parameters', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.parameters).toHaveLength(3)
    const titleParam = create?.parameters.find(p => p.name === 'title')
    expect(titleParam).toMatchObject({ type: 'string', required: true })
  })

  it('extracts path/query parameters', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const get = result.find(a => a.method === 'GET')
    expect(get?.parameters).toHaveLength(1)
    expect(get?.parameters[0]?.name).toBe('id')
  })

  it('falls back to path+method slug when operationId is missing', () => {
    const spec = {
      ...MINIMAL_SPEC,
      paths: { '/users': { get: { summary: 'List users' } } }
    }
    const result = parseOpenAPISpec(spec, 'https://api.example.com')
    expect(result[0]?.name).toBe('get_users')
  })

  it('returns empty array for spec with no paths', () => {
    const result = parseOpenAPISpec({ openapi: '3.0.0', info: {}, paths: {} }, 'https://api.example.com')
    expect(result).toHaveLength(0)
  })

  it('skips unsupported HTTP methods (head, options, trace)', () => {
    const spec = {
      ...MINIMAL_SPEC,
      paths: { '/ping': { head: { summary: 'Ping' }, get: { summary: 'Ping GET' } } }
    }
    const result = parseOpenAPISpec(spec, 'https://api.example.com')
    expect(result).toHaveLength(1)
    expect(result[0]?.method).toBe('GET')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run lib/openapi-parser.test.ts
```

Expected: FAIL — "Cannot find module './openapi-parser'"

**Step 3: Implement the parser**

```typescript
// lib/openapi-parser.ts
import type { CandidateAction, ActionParameter } from '@/types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

// Loosely-typed OpenAPI shapes — we only read what we need
interface OpenAPIOperation {
  operationId?: string
  summary?: string
  description?: string
  parameters?: Array<{
    name: string
    in: string
    required?: boolean
    schema?: { type?: string }
    description?: string
  }>
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: {
          type?: string
          required?: string[]
          properties?: Record<string, { type?: string; description?: string }>
        }
      }
    }
  }
}

interface OpenAPISpec {
  servers?: Array<{ url: string }>
  paths?: Record<string, Record<string, unknown>>
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/, '')
    .slice(0, 64)
}

function resolveType(raw: string | undefined): 'string' | 'number' | 'boolean' {
  if (raw === 'number' || raw === 'integer') return 'number'
  if (raw === 'boolean') return 'boolean'
  return 'string'
}

function extractParameters(op: OpenAPIOperation): ActionParameter[] {
  const params: ActionParameter[] = []
  const requiredBodyFields = new Set<string>(
    op.requestBody?.content?.['application/json']?.schema?.required ?? []
  )

  // Path/query parameters
  for (const p of op.parameters ?? []) {
    if (p.in === 'header') continue // skip — handled by action headers
    params.push({
      name:        p.name,
      type:        resolveType(p.schema?.type),
      description: p.description ?? p.name,
      required:    p.required ?? false,
    })
  }

  // Request body properties
  const bodyProps = op.requestBody?.content?.['application/json']?.schema?.properties ?? {}
  for (const [name, prop] of Object.entries(bodyProps)) {
    params.push({
      name,
      type:        resolveType(prop.type),
      description: prop.description ?? name,
      required:    requiredBodyFields.has(name),
    })
  }

  return params
}

export function parseOpenAPISpec(
  spec: OpenAPISpec,
  baseUrl: string
): CandidateAction[] {
  const results: CandidateAction[] = []
  const base = baseUrl.replace(/\/$/, '')

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of SUPPORTED_METHODS) {
      const opRaw = (pathItem as Record<string, unknown>)[method.toLowerCase()]
      if (!opRaw || typeof opRaw !== 'object') continue

      const op = opRaw as OpenAPIOperation
      const name = op.operationId
        ? slugify(op.operationId)
        : slugify(`${method}_${path}`)

      results.push({
        name,
        displayName:  op.summary ?? name,
        description:  op.description ?? op.summary ?? name,
        method,
        endpoint:     `${base}${path}`,
        parameters:   extractParameters(op),
      })
    }
  }

  return results
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm vitest run lib/openapi-parser.test.ts
```

Expected: all 8 tests PASS.

**Step 5: Commit**

```bash
git add lib/openapi-parser.ts lib/openapi-parser.test.ts
git commit -m "feat: add OpenAPI spec parser utility with tests"
```

---

## Task 7: Create OpenAPI import API route

**Files:**
- Create: `app/api/openapi-import/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ImplyError } from '@/lib/errors'
import { OpenAPIImportSchema } from '@/lib/validations'
import { parseOpenAPISpec } from '@/lib/openapi-parser'

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
]

function isPrivateHost(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return PRIVATE_IP_PATTERNS.some(re => re.test(hostname))
  } catch {
    return true
  }
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: 'Validation error', code: 'VALIDATION_ERROR', metadata: { issues: error.issues } } },
      { status: 400 }
    )
  }
  if (error instanceof ImplyError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode }
    )
  }
  console.error('OpenAPI import error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const validated = OpenAPIImportSchema.parse(body)

    let rawSpec: string
    let baseUrl = ''

    if (validated.url !== undefined) {
      if (isPrivateHost(validated.url)) {
        return NextResponse.json(
          { error: { message: 'Private/internal URLs are not allowed', code: 'FORBIDDEN_URL' } },
          { status: 400 }
        )
      }

      const res = await fetch(validated.url, {
        headers: { Accept: 'application/json, application/yaml, text/yaml' },
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        return NextResponse.json(
          { error: { message: `Failed to fetch spec: ${res.statusText}`, code: 'FETCH_FAILED' } },
          { status: 400 }
        )
      }

      rawSpec = await res.text()
      baseUrl = new URL(validated.url).origin
    } else {
      rawSpec = validated.spec!
    }

    // Parse JSON only (YAML support is a follow-up)
    let spec: Record<string, unknown>
    try {
      spec = JSON.parse(rawSpec) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: { message: 'Could not parse spec. Only JSON format is currently supported.', code: 'PARSE_ERROR' } },
        { status: 400 }
      )
    }

    // Resolve base URL from spec servers if not already set
    if (!baseUrl) {
      const servers = (spec.servers as Array<{ url: string }> | undefined) ?? []
      baseUrl = servers[0]?.url ?? ''
    }

    if (!baseUrl) {
      return NextResponse.json(
        { error: { message: 'Could not determine base URL. Provide a spec URL or ensure the spec has a servers array.', code: 'NO_BASE_URL' } },
        { status: 400 }
      )
    }

    const candidates = parseOpenAPISpec(spec, baseUrl)

    return NextResponse.json({ data: candidates })
  } catch (error) {
    return errorResponse(error)
  }
}
```

**Step 2: Commit**

```bash
git add app/api/openapi-import/route.ts
git commit -m "feat: add OpenAPI import API route with SSRF protection"
```

---

## Task 8: Add Actions to the Sidebar

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

**Step 1: Add the Actions nav item**

In `Sidebar.tsx`, find the `NAV_ITEMS` array. Insert this object after the `Knowledge Base` entry and before `Stats`:

```typescript
{
  label: 'Actions',
  href: (id) => `/dashboard/${id}/actions`,
  icon: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  )
},
```

**Step 2: Verify type-check**

```bash
pnpm tsc --noEmit
```

Expected: exit 0.

**Step 3: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add Actions nav item to sidebar"
```

---

## Task 9: Create ActionPanel slide-in component

**Files:**
- Create: `components/dashboard/ActionPanel.tsx`

**Step 1: Create the file**

```typescript
'use client'

import { useState, useEffect, useCallback, type JSX } from 'react'
import type { ActionDetail, ActionParameter } from '@/types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type ParamType = 'string' | 'number' | 'boolean'

interface KVRow { key: string; value: string }
interface ParamRow { name: string; type: ParamType; description: string; required: boolean }

interface ActionPanelProps {
  projectId:   string
  action:      ActionDetail | null // null = create mode
  onClose:     () => void
  onSaved:     () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/, '')
    .slice(0, 64)
}

export default function ActionPanel({ projectId, action, onClose, onSaved }: ActionPanelProps): JSX.Element {
  const isEdit = action !== null

  const [displayName,          setDisplayName]          = useState(action?.displayName ?? '')
  const [name,                 setName]                 = useState(action?.name ?? '')
  const [nameManuallyEdited,   setNameManuallyEdited]   = useState(isEdit)
  const [description,          setDescription]          = useState(action?.description ?? '')
  const [method,               setMethod]               = useState<HttpMethod>(action?.method ?? 'POST')
  const [endpoint,             setEndpoint]             = useState(action?.endpoint ?? '')
  const [headers,              setHeaders]              = useState<KVRow[]>(
    Object.entries(action?.headers ?? {}).map(([key, value]) => ({ key, value }))
  )
  const [parameters,           setParameters]           = useState<ParamRow[]>(
    (action?.parameters ?? []).map(p => ({ ...p })) as ParamRow[]
  )
  const [requiresConfirmation, setRequiresConfirmation] = useState(action?.requiresConfirmation ?? false)
  const [enabled,              setEnabled]              = useState(action?.enabled ?? true)
  const [saving,               setSaving]               = useState(false)
  const [error,                setError]                = useState<string | null>(null)

  // Auto-slug display name into internal name (only when not manually edited)
  useEffect(() => {
    if (!nameManuallyEdited) {
      setName(slugify(displayName))
    }
  }, [displayName, nameManuallyEdited])

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true)
    setError(null)

    const headersRecord: Record<string, string> = {}
    for (const row of headers) {
      if (row.key.trim()) headersRecord[row.key.trim()] = row.value
    }

    const params: ActionParameter[] = parameters
      .filter(p => p.name.trim())
      .map(p => ({
        name:        p.name.trim(),
        type:        p.type,
        description: p.description.trim() || p.name.trim(),
        required:    p.required,
      }))

    const payload = { name, displayName, description, method, endpoint, headers: headersRecord, parameters: params, requiresConfirmation, enabled }

    const url = isEdit
      ? `/api/projects/${projectId}/actions/${action.id}`
      : `/api/projects/${projectId}/actions`

    try {
      const res = await fetch(url, {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json() as { error?: { message: string } }
      if (!res.ok) {
        setError(json.error?.message ?? 'Save failed')
        return
      }
      onSaved()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [action, displayName, name, description, method, endpoint, headers, parameters, requiresConfirmation, enabled, isEdit, projectId, onSaved])

  function addHeader(): void { setHeaders(prev => [...prev, { key: '', value: '' }]) }
  function removeHeader(i: number): void { setHeaders(prev => prev.filter((_, idx) => idx !== i)) }
  function updateHeader(i: number, field: 'key' | 'value', val: string): void {
    setHeaders(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  function addParam(): void { setParameters(prev => [...prev, { name: '', type: 'string', description: '', required: false }]) }
  function removeParam(i: number): void { setParameters(prev => prev.filter((_, idx) => idx !== i)) }
  function updateParam<K extends keyof ParamRow>(i: number, field: K, val: ParamRow[K]): void {
    setParameters(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  const inputClass = 'w-full rounded-lg border border-[var(--color-shell-200)] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[560px] flex-col shadow-xl" style={{ backgroundColor: 'var(--color-shell-50)', borderLeft: '1px solid var(--color-shell-200)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-shell-200)' }}>
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit action' : 'New action'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--color-shell-200)] hover:text-gray-600 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* 1. Basic info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Basic info</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Display name</label>
                <input className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Create Support Ticket" />
              </div>
              <div>
                <label className={labelClass}>Internal name <span className="text-gray-400 font-normal">(used by AI)</span></label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={e => { setName(e.target.value); setNameManuallyEdited(true) }}
                  placeholder="create_support_ticket"
                />
              </div>
              <div>
                <label className={labelClass}>Description <span className="text-gray-400 font-normal">(tell the AI when to use this)</span></label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Creates a support ticket when the user reports a problem or requests help."
                />
              </div>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 2. HTTP config */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">HTTP config</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Method</label>
                <select
                  className={inputClass}
                  value={method}
                  onChange={e => setMethod(e.target.value as HttpMethod)}
                >
                  {(['GET','POST','PUT','PATCH','DELETE'] as const).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Endpoint URL</label>
                <input className={inputClass} value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.yourapp.com/tickets" />
              </div>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 3. Headers */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Headers</h3>
            <div className="space-y-2">
              {headers.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={`${inputClass} flex-1`} value={row.key}   onChange={e => updateHeader(i, 'key',   e.target.value)} placeholder="Authorization" />
                  <input className={`${inputClass} flex-1`} value={row.value} onChange={e => updateHeader(i, 'value', e.target.value)} placeholder="Bearer sk-..." />
                  <button onClick={() => removeHeader(i)} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button onClick={addHeader} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                + Add header
              </button>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 4. Parameters */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Parameters</h3>
            <div className="space-y-2">
              {parameters.length > 0 && (
                <div className="grid grid-cols-[1fr_100px_1fr_auto_auto] gap-2 mb-1">
                  <span className="text-xs text-gray-400">Name</span>
                  <span className="text-xs text-gray-400">Type</span>
                  <span className="text-xs text-gray-400">Description</span>
                  <span className="text-xs text-gray-400">Req.</span>
                  <span />
                </div>
              )}
              {parameters.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_1fr_auto_auto] gap-2 items-center">
                  <input className={inputClass} value={row.name} onChange={e => updateParam(i, 'name', e.target.value)} placeholder="ticket_title" />
                  <select className={inputClass} value={row.type} onChange={e => updateParam(i, 'type', e.target.value as ParamType)}>
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                  <input className={inputClass} value={row.description} onChange={e => updateParam(i, 'description', e.target.value)} placeholder="Short description" />
                  <input type="checkbox" checked={row.required} onChange={e => updateParam(i, 'required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                  <button onClick={() => removeParam(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button onClick={addParam} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                + Add parameter
              </button>
            </div>
          </section>

          <hr style={{ borderColor: 'var(--color-shell-200)' }} />

          {/* 5. Behaviour */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Behaviour</h3>
            <div className="space-y-3">
              {[
                { label: 'Require confirmation before executing', sublabel: 'AI will ask the user to confirm before running this action', checked: requiresConfirmation, onChange: setRequiresConfirmation },
                { label: 'Enabled', sublabel: 'Disabled actions are not available to the AI', checked: enabled, onChange: setEnabled },
              ].map(({ label, sublabel, checked, onChange }) => (
                <label key={label} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{sublabel}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid var(--color-shell-200)' }}>
          {error !== null
            ? <p className="text-sm text-red-500 truncate max-w-[300px]">{error}</p>
            : <span />
          }
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-[var(--color-shell-200)] transition-colors">
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || !displayName.trim() || !name.trim() || !endpoint.trim()}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

**Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: exit 0.

**Step 3: Commit**

```bash
git add components/dashboard/ActionPanel.tsx
git commit -m "feat: add ActionPanel slide-in component"
```

---

## Task 10: Create OpenAPIImportModal component

**Files:**
- Create: `components/dashboard/OpenAPIImportModal.tsx`

**Step 1: Create the file**

```typescript
'use client'

import { useState, type JSX } from 'react'
import type { CandidateAction } from '@/types/api'
import type { APIResponse } from '@/types/api'

type Step = 'source' | 'select' | 'importing'

interface ImportResult {
  candidate: CandidateAction
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface OpenAPIImportModalProps {
  projectId: string
  onClose:   () => void
  onDone:    () => void
}

export default function OpenAPIImportModal({ projectId, onClose, onDone }: OpenAPIImportModalProps): JSX.Element {
  const [step,       setStep]       = useState<Step>('source')
  const [url,        setUrl]        = useState('')
  const [specText,   setSpecText]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateAction[]>([])
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [results,    setResults]    = useState<ImportResult[]>([])

  async function handlePreview(): Promise<void> {
    setLoading(true)
    setFetchError(null)
    try {
      const payload = url.trim() ? { url: url.trim() } : { spec: specText.trim() }
      const res = await fetch('/api/openapi-import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json() as APIResponse<CandidateAction[]>
      if (!res.ok) {
        setFetchError(json.error?.message ?? 'Failed to parse spec')
        return
      }
      const list = json.data ?? []
      if (list.length === 0) {
        setFetchError('No endpoints found in this spec.')
        return
      }
      setCandidates(list)
      setSelected(new Set(list.map((_, i) => i)))
      setStep('select')
    } catch {
      setFetchError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(): Promise<void> {
    const toImport = candidates.filter((_, i) => selected.has(i))
    const initialResults: ImportResult[] = toImport.map(c => ({ candidate: c, status: 'pending' }))
    setResults(initialResults)
    setStep('importing')

    for (let i = 0; i < toImport.length; i++) {
      const candidate = toImport[i]!
      try {
        const res = await fetch(`/api/projects/${projectId}/actions`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(candidate),
        })
        const json = await res.json() as { error?: { message: string } }
        setResults(prev => prev.map((r, idx) =>
          idx === i
            ? { ...r, status: res.ok ? 'success' : 'error', error: res.ok ? undefined : (json.error?.message ?? 'Failed') }
            : r
        ))
      } catch {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'error', error: 'Network error' } : r
        ))
      }
    }
  }

  function toggleAll(checked: boolean): void {
    setSelected(checked ? new Set(candidates.map((_, i) => i)) : new Set())
  }

  const inputClass = 'w-full rounded-lg border border-[var(--color-shell-200)] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  const METHOD_COLORS: Record<string, string> = {
    GET:    'bg-emerald-100 text-emerald-700',
    POST:   'bg-blue-100 text-blue-700',
    PUT:    'bg-amber-100 text-amber-700',
    PATCH:  'bg-purple-100 text-purple-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={step !== 'importing' ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl"
        style={{ backgroundColor: 'var(--color-shell-50)', border: '1px solid var(--color-shell-200)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-shell-200)' }}>
          <h2 className="text-base font-semibold text-gray-900">Import from OpenAPI</h2>
          {step !== 'importing' && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--color-shell-200)] transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Step 1: Source */}
        {step === 'source' && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Spec URL</label>
              <input className={inputClass} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.yourapp.com/openapi.json" />
            </div>
            <div className="flex items-center gap-3">
              <hr className="flex-1" style={{ borderColor: 'var(--color-shell-200)' }} />
              <span className="text-xs text-gray-400">or paste JSON</span>
              <hr className="flex-1" style={{ borderColor: 'var(--color-shell-200)' }} />
            </div>
            <textarea
              className={`${inputClass} resize-none font-mono text-xs`}
              rows={6}
              value={specText}
              onChange={e => setSpecText(e.target.value)}
              placeholder={'{\n  "openapi": "3.0.0",\n  ...\n}'}
            />
            {fetchError !== null && <p className="text-sm text-red-500">{fetchError}</p>}
            <div className="flex justify-end">
              <button
                onClick={() => void handlePreview()}
                disabled={loading || (!url.trim() && !specText.trim())}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-40 transition-opacity"
              >
                {loading ? 'Parsing…' : 'Preview endpoints'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select */}
        {step === 'select' && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{candidates.length} endpoint{candidates.length !== 1 ? 's' : ''} detected</p>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === candidates.length}
                  onChange={e => toggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                Select all
              </label>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 -mx-2 px-2">
              {candidates.map((c, i) => (
                <label key={i} className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-[var(--color-shell-100)] transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={e => {
                      const next = new Set(selected)
                      e.target.checked ? next.add(i) : next.delete(i)
                      setSelected(next)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 flex-shrink-0"
                  />
                  <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${METHOD_COLORS[c.method] ?? ''}`}>{c.method}</span>
                  <span className="text-sm text-gray-800 truncate flex-1">{c.displayName}</span>
                  <span className="text-xs text-gray-400 truncate max-w-[160px]">{new URL(c.endpoint).pathname}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => void handleImport()}
                disabled={selected.size === 0}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-40 transition-opacity"
              >
                Import {selected.size} action{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="px-6 py-5 space-y-3">
            <div className="max-h-72 overflow-y-auto space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  {r.status === 'pending' && <svg className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {r.status === 'success' && <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
                  {r.status === 'error'   && <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>}
                  <span className="text-sm text-gray-800 truncate flex-1">{r.candidate.displayName}</span>
                  {r.error !== undefined && <span className="text-xs text-red-500 truncate max-w-[180px]">{r.error}</span>}
                </div>
              ))}
            </div>
            {results.every(r => r.status !== 'pending') && (
              <div className="flex justify-end pt-2">
                <button onClick={onDone} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity">
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
```

**Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: exit 0.

**Step 3: Commit**

```bash
git add components/dashboard/OpenAPIImportModal.tsx
git commit -m "feat: add OpenAPIImportModal 3-step component"
```

---

## Task 11: Create the Actions list page

**Files:**
- Create: `app/(dashboard)/dashboard/[projectId]/actions/page.tsx`

**Step 1: Create the file**

```typescript
'use client'

import { useEffect, useState, useCallback, type JSX } from 'react'
import { useParams } from 'next/navigation'
import type { ActionItem, ActionDetail } from '@/types/api'
import type { APIResponse } from '@/types/api'
import ActionPanel from '@/components/dashboard/ActionPanel'
import OpenAPIImportModal from '@/components/dashboard/OpenAPIImportModal'

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100 text-blue-700',
  PUT:    'bg-amber-100 text-amber-700',
  PATCH:  'bg-purple-100 text-purple-700',
  DELETE: 'bg-red-100 text-red-700',
}

export default function ActionsPage(): JSX.Element {
  const params    = useParams()
  const projectId = params['projectId'] as string

  const [actions,      setActions]      = useState<ActionItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [panelOpen,    setPanelOpen]    = useState(false)
  const [editAction,   setEditAction]   = useState<ActionDetail | null>(null)
  const [importOpen,   setImportOpen]   = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [togglingId,   setTogglingId]   = useState<string | null>(null)

  const fetchActions = useCallback(async (): Promise<void> => {
    try {
      const res  = await fetch(`/api/projects/${projectId}/actions`)
      const json = await res.json() as APIResponse<ActionItem[]>
      if (res.ok) setActions(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void fetchActions() }, [fetchActions])

  async function handleToggleEnabled(action: ActionItem): Promise<void> {
    setTogglingId(action.id)
    // Optimistic update
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: !a.enabled } : a))
    try {
      const res = await fetch(`/api/projects/${projectId}/actions/${action.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled: !action.enabled }),
      })
      if (!res.ok) {
        // Revert on failure
        setActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: action.enabled } : a))
      }
    } catch {
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: action.enabled } : a))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setDeletingId(id)
    try {
      await fetch(`/api/projects/${projectId}/actions/${id}`, { method: 'DELETE' })
      setActions(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleEditClick(action: ActionItem): Promise<void> {
    const res  = await fetch(`/api/projects/${projectId}/actions/${action.id}`)
    const json = await res.json() as APIResponse<ActionDetail>
    if (res.ok && json.data) {
      setEditAction(json.data)
      setPanelOpen(true)
    }
  }

  function handleNewAction(): void {
    setEditAction(null)
    setPanelOpen(true)
  }

  function handlePanelSaved(): void {
    setPanelOpen(false)
    setEditAction(null)
    void fetchActions()
  }

  function handlePanelClose(): void {
    setPanelOpen(false)
    setEditAction(null)
  }

  return (
    <div className="max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Actions</h1>
          <p className="mt-1 text-sm text-gray-500">Define HTTP endpoints the AI can call on behalf of users.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--color-shell-200)]"
            style={{ borderColor: 'var(--color-shell-200)', backgroundColor: 'var(--color-shell-50)' }}
          >
            Import from OpenAPI
          </button>
          <button
            onClick={handleNewAction}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
          >
            New action
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--color-shell-200)]" />)}
        </div>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ backgroundColor: 'var(--color-shell-50)', border: '1px solid var(--color-shell-200)' }}>
          <svg className="mb-4 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <p className="text-sm font-medium text-gray-600">No actions yet</p>
          <p className="mt-1 text-xs text-gray-400">Create an action to let the AI take real steps in your product.</p>
          <button
            onClick={handleNewAction}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
          >
            Create your first action
          </button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-shell-200)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-shell-100)', borderBottom: '1px solid var(--color-shell-200)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Endpoint</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Enabled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {actions.map((action, i) => {
                const isDeleting = deletingId === action.id
                const isConfirming = deletingId === `confirm-${action.id}`
                return (
                  <tr
                    key={action.id}
                    className={`transition-colors ${isDeleting || isConfirming ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : ''}`}
                    style={!(isDeleting || isConfirming) && i % 2 !== 0 ? { backgroundColor: 'var(--color-shell-50)' } : undefined}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{action.displayName}</p>
                      <p className="text-xs text-gray-400 font-mono">{action.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono ${METHOD_COLORS[action.method] ?? ''}`}>
                        {action.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="text-gray-600 text-xs font-mono truncate block">{action.endpoint}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void handleToggleEnabled(action)}
                        disabled={togglingId === action.id}
                        aria-label={action.enabled ? 'Disable action' : 'Enable action'}
                        className={`inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${action.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${action.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isConfirming ? (
                          <>
                            <span className="text-xs text-red-600 mr-1">Delete?</span>
                            <button
                              onClick={() => void handleDelete(action.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => void handleEditClick(action)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--color-shell-200)] hover:text-gray-700 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingId(`confirm-${action.id}`)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {panelOpen && (
        <ActionPanel
          projectId={projectId}
          action={editAction}
          onClose={handlePanelClose}
          onSaved={handlePanelSaved}
        />
      )}

      {importOpen && (
        <OpenAPIImportModal
          projectId={projectId}
          onClose={() => setImportOpen(false)}
          onDone={() => { setImportOpen(false); void fetchActions() }}
        />
      )}
    </div>
  )
}
```

**Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: exit 0.

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/[projectId]/actions/page.tsx
git commit -m "feat: add Actions list page with panel and import modal integration"
```

---

## Task 12: Final verification

**Step 1: Full type-check**

```bash
pnpm tsc --noEmit
```

Expected: exit 0, no errors.

**Step 2: Run all tests**

```bash
pnpm vitest run
```

Expected: all tests pass, including the 8 new OpenAPI parser tests.

**Step 3: Smoke test in browser**

- Navigate to `/dashboard/[any-project-id]/actions`
- Verify empty state renders
- Click "New action", fill in a form, save → row appears in table
- Toggle enabled → toggle switches
- Click Edit → panel re-opens with data pre-filled
- Click delete → inline confirm → row removed
- Click "Import from OpenAPI" → paste a sample spec → verify endpoints listed → import

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any final type or runtime issues in Actions CRUD"
```
