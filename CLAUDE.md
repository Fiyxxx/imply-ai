# CLAUDE.md - Imply Development Guide

**Project:** Imply - Drop-in AI Copilot Infrastructure for B2B SaaS
**Last Updated:** 2026-02-16
**Status:** Active Development

---

## CRITICAL: READ THIS FIRST

This document is the **single source of truth** for how Imply is architected and built. Every architectural decision, coding standard, and best practice must be documented here. When building ANY component of Imply, you MUST follow these guidelines exactly.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Coding Standards](#5-coding-standards)
6. [Component Patterns](#6-component-patterns)
7. [API Design](#7-api-design)
8. [Database Schema](#8-database-schema)
9. [External Services Integration](#9-external-services-integration)
10. [Error Handling](#10-error-handling)
11. [Security](#11-security)
12. [Testing](#12-testing)
13. [Performance](#13-performance)
14. [Deployment](#14-deployment)

---

## 1. Project Overview

### What is Imply?

Imply is a drop-in AI copilot infrastructure that enables any SaaS product to add an intelligent assistant via a single script tag. It combines:
- **Fast retrieval** (EmergentDB: <100ms vector search)
- **Intelligent responses** (Claude Sonnet 4.5)
- **Action execution** (Agentic AI capabilities)
- **Simple integration** (One script tag)

### Target Users

1. **SaaS Admins** - Our customers who integrate Imply into their products
2. **End Users** - Users of our customers' SaaS products who interact with the widget

### Core Value Proposition

- Deploy AI copilot in <1 hour
- No AI expertise required
- Fast, accurate responses (<2s total)
- Actions, not just answers

---

## 2. Architecture Principles

### Core Principles

**1. MODULARITY**
- Every component must be independently testable
- No circular dependencies
- Clear separation of concerns
- Services should be replaceable

**2. SCALABILITY**
- Stateless API design (horizontal scaling ready)
- Async where possible (queues for heavy operations)
- Database queries optimized (indexes, proper relations)
- Caching strategy for frequently accessed data

**3. MAINTAINABILITY**
- Self-documenting code (clear naming, TSDoc comments)
- Consistent patterns across codebase
- DRY principle (extract reusable logic)
- Single responsibility per module

**4. RELIABILITY**
- Graceful degradation (fallbacks for external services)
- Comprehensive error handling
- Monitoring and logging at all layers
- No silent failures

**5. SECURITY FIRST**
- Input validation everywhere
- Parameterized queries (no SQL injection)
- API key scoping (read-only for widget)
- Audit logging for sensitive operations

### Architectural Layers

```
┌─────────────────────────────────────────┐
│  Presentation Layer                     │
│  - Widget (React → Vanilla JS)         │
│  - Dashboard (Next.js pages)           │
│  - Landing page                         │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  API Layer (Next.js API Routes)        │
│  - Request validation                   │
│  - Authentication                       │
│  - Route handlers                       │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  Service Layer (lib/)                   │
│  - Business logic                       │
│  - RAG orchestration                    │
│  - Action execution                     │
│  - Document processing                  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  Data Layer                             │
│  - Prisma ORM                           │
│  - EmergentDB client                    │
│  - External API clients                 │
└─────────────────────────────────────────┘
```

**RULE:** Never skip layers. Widget → API → Service → Data. No direct DB access from API routes.

---

## 3. Tech Stack

### Frontend
- **Next.js 14+** (App Router only, no Pages Router)
- **React 18+** (Server Components where possible)
- **TypeScript 5+** (strict mode enabled)
- **Tailwind CSS 3+** (utility-first styling)
- **Shadcn/ui** (component library)
- **Radix UI** (accessible primitives)

### Backend
- **Next.js API Routes** (serverless functions)
- **Prisma 5+** (ORM with migrations)
- **Vercel Postgres** (managed PostgreSQL)

### External Services
- **EmergentDB** (vector database, self-hosted)
- **Anthropic Claude Sonnet 4.5** (LLM)
- **OpenAI text-embedding-3-small** (embeddings)

### Dev Tools
- **pnpm** (package manager - REQUIRED, not npm/yarn)
- **ESLint** + **Prettier** (code quality)
- **Vitest** (unit tests)
- **TypeScript strict mode** (no any types allowed)

---

## 4. Project Structure

### Strict Directory Rules

```
imply-ai/
├─ app/                          # Next.js App Router ONLY
│  ├─ (marketing)/               # Route group for public pages
│  │  ├─ page.tsx                # Landing page
│  │  ├─ pricing/page.tsx
│  │  └─ docs/page.tsx
│  │
│  ├─ (dashboard)/               # Route group for authenticated pages
│  │  ├─ layout.tsx              # Dashboard layout with auth
│  │  └─ dashboard/
│  │     ├─ page.tsx             # Project list
│  │     └─ [projectId]/         # Dynamic project pages
│  │
│  ├─ api/                       # API routes
│  │  ├─ chat/route.ts
│  │  ├─ documents/
│  │  │  ├─ route.ts             # GET (list), POST (upload)
│  │  │  └─ [id]/route.ts        # GET, PATCH, DELETE
│  │  └─ actions/
│  │
│  ├─ layout.tsx                 # Root layout
│  └─ globals.css                # Global styles (Tailwind)
│
├─ components/
│  ├─ ui/                        # Shadcn/ui components (auto-generated)
│  ├─ landing/                   # Landing page components
│  ├─ dashboard/                 # Dashboard-specific components
│  └─ widget/                    # Widget components (embedded)
│
├─ lib/
│  ├─ db.ts                      # Prisma client singleton
│  ├─ emergentdb.ts              # EmergentDB client class
│  ├─ claude.ts                  # Claude API client class
│  ├─ embeddings.ts              # OpenAI embedding functions
│  ├─ rag.ts                     # RAG orchestration
│  ├─ actions.ts                 # Action execution logic
│  ├─ documents.ts               # Document processing
│  ├─ validations.ts             # Zod schemas
│  └─ utils.ts                   # Utility functions
│
├─ prisma/
│  ├─ schema.prisma              # Database schema
│  └─ migrations/                # Migration files (DO NOT edit manually)
│
├─ public/
│  ├─ widget.js                  # Compiled widget bundle
│  └─ assets/                    # Static assets
│
├─ scripts/
│  ├─ build-widget.ts            # Widget compilation script
│  └─ seed.ts                    # Database seeding
│
├─ tests/
│  ├─ unit/                      # Unit tests (co-located with lib/)
│  └─ e2e/                       # E2E tests
│
├─ types/                        # Shared TypeScript types
│  ├─ api.ts                     # API request/response types
│  ├─ widget.ts                  # Widget types
│  └─ index.ts                   # Barrel exports
│
├─ .env.local                    # Local environment variables
├─ .env.example                  # Example env file (commit this)
├─ .gitignore
├─ package.json
├─ tsconfig.json                 # Strict TypeScript config
├─ tailwind.config.ts
├─ next.config.js
├─ prettier.config.js
├─ eslint.config.js
└─ CLAUDE.md                     # This file
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `ChatWindow.tsx`)
- Utilities: `kebab-case.ts` (e.g., `rate-limiter.ts`)
- API routes: `route.ts` (Next.js convention)
- Tests: `*.test.ts` or `*.spec.ts`

**Directories:**
- Features: `kebab-case/` (e.g., `document-upload/`)
- Route groups: `(kebab-case)/` (e.g., `(dashboard)/`)

**Variables:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- Functions: `camelCase` (e.g., `generateEmbedding`)
- Classes: `PascalCase` (e.g., `EmergentDBClient`)
- Types/Interfaces: `PascalCase` (e.g., `ChatMessage`)

---

## 5. Coding Standards

### TypeScript Rules

**STRICT MODE REQUIRED:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**NEVER:**
- ❌ Use `any` type (use `unknown` if truly unknown)
- ❌ Use `@ts-ignore` (fix the type error instead)
- ❌ Use `as` type assertions without validation
- ❌ Skip function return types
- ❌ Use `var` (only `const` and `let`)

**ALWAYS:**
- ✅ Define explicit return types for functions
- ✅ Use `readonly` for immutable arrays/objects
- ✅ Use discriminated unions for state management
- ✅ Use Zod for runtime validation + type inference
- ✅ Extract types to `types/` if shared across files

**Example:**
```typescript
// ❌ BAD
export async function getProject(id: any) {
  const project = await db.project.findUnique({ where: { id } })
  return project
}

// ✅ GOOD
import { z } from 'zod'
import type { Project } from '@prisma/client'

const ProjectIdSchema = z.string().uuid()

export async function getProject(id: string): Promise<Project | null> {
  const validId = ProjectIdSchema.parse(id) // Runtime validation
  const project = await db.project.findUnique({
    where: { id: validId }
  })
  return project
}
```

### React Component Rules

**Server Components by Default:**
```typescript
// app/dashboard/[projectId]/page.tsx
// Default: Server Component (no 'use client')

export default async function ProjectPage({
  params
}: {
  params: { projectId: string }
}) {
  const project = await getProject(params.projectId) // Direct DB access OK
  return <ProjectDetails project={project} />
}
```

**Client Components Only When Needed:**
```typescript
// components/dashboard/DeleteButton.tsx
'use client' // ONLY when you need: hooks, event handlers, browser APIs

import { useState } from 'react'

export function DeleteButton({ projectId }: { projectId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

**Component Structure:**
```typescript
// ✅ GOOD: Clear structure

import type { ReactNode } from 'react'

// 1. Types (props interface)
interface ChatWindowProps {
  projectId: string
  onClose: () => void
  children?: ReactNode
}

// 2. Component
export function ChatWindow({ projectId, onClose, children }: ChatWindowProps) {
  // 3. Hooks (top of component)
  const [messages, setMessages] = useState<Message[]>([])

  // 4. Event handlers (before render)
  const handleSend = (text: string) => {
    // ...
  }

  // 5. Render (return statement)
  return (
    <div className="chat-window">
      {/* ... */}
    </div>
  )
}

// 6. Sub-components (if needed, otherwise extract to separate file)
function MessageList() {
  // ...
}
```

### Styling Rules

**Tailwind CSS Only:**
```tsx
// ✅ GOOD: Utility classes
<div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md">
  <h2 className="text-xl font-semibold">Title</h2>
</div>

// ❌ BAD: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '20px' }}>Title</h2>
</div>
```

**Extract Repeated Patterns:**
```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// components/Button.tsx
export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg bg-blue-500 px-4 py-2 font-medium text-white',
        'hover:bg-blue-600',
        'disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
```

---

## 6. Component Patterns

### RAG Pipeline Pattern

```typescript
// lib/rag.ts
import type { Message, Project } from '@prisma/client'

export interface RAGResponse {
  messageId: string
  conversationId: string
  content: string
  sources: DocumentSource[]
  action?: ActionSuggestion
}

export async function retrieveAndGenerate(
  projectId: string,
  userMessage: string,
  conversationId?: string
): Promise<RAGResponse> {
  // 1. Load project configuration
  const project = await loadProjectWithConfig(projectId)

  // 2. Generate embedding for query
  const queryEmbedding = await generateEmbedding(userMessage)

  // 3. Search vector database
  const searchResults = await searchEmergentDB({
    embedding: queryEmbedding,
    projectId,
    topK: project.retrievalConfig.topK,
    threshold: project.retrievalConfig.relevanceThreshold,
    collections: project.retrievalConfig.enabledCollections
  })

  // 4. Build context from results
  const context = searchResults.map(r => r.content)

  // 5. Generate response with Claude
  const response = await generateClaudeResponse({
    systemPrompt: project.systemPrompt,
    context,
    userMessage,
    actions: project.actions,
    guardrails: project.guardrails
  })

  // 6. Parse for action suggestions
  const action = parseActionFromResponse(response)

  // 7. Save to database
  const message = await saveMessage({
    conversationId: conversationId || await createConversation(projectId),
    role: 'assistant',
    content: response,
    sources: searchResults
  })

  return {
    messageId: message.id,
    conversationId: message.conversationId,
    content: response,
    sources: searchResults,
    action
  }
}
```

### Error Handling Pattern

```typescript
// lib/errors.ts
export class ImplyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class RateLimitError extends ImplyError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
  }
}

export class ValidationError extends ImplyError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, metadata)
  }
}

// Usage in API route
// app/api/chat/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await retrieveAndGenerate(body.projectId, body.message)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ImplyError) {
      return NextResponse.json(
        { error: error.message, code: error.code, metadata: error.metadata },
        { status: error.statusCode }
      )
    }

    // Unknown error - log and return generic message
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Client Pattern (External Services)

```typescript
// lib/emergentdb.ts
export interface SearchResult {
  id: string
  score: number
  metadata: {
    documentId: string
    projectId: string
    content: string
    filename: string
  }
}

export class EmergentDBClient {
  private baseUrl: string
  private timeout: number

  constructor(config: { url?: string; timeout?: number } = {}) {
    this.baseUrl = config.url || process.env.EMERGENTDB_URL!
    this.timeout = config.timeout || 2000

    if (!this.baseUrl) {
      throw new Error('EMERGENTDB_URL is required')
    }
  }

  async search(
    embedding: number[],
    options: {
      projectId: string
      topK?: number
      collections?: string[]
    }
  ): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: embedding,
          k: options.topK || 5,
          filter: {
            projectId: options.projectId,
            collections: options.collections
          }
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new EmergentDBError(
          `Search failed: ${response.statusText}`,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new EmergentDBError('Search timeout', 408)
      }
      throw error
    }
  }

  async insert(
    id: string,
    embedding: number[],
    metadata: Record<string, unknown>
  ): Promise<void> {
    // Similar pattern...
  }
}

// Singleton instance
export const emergentDB = new EmergentDBClient()
```

---

## 7. API Design

### REST Conventions

**Resource naming:**
- Plural nouns: `/api/projects`, `/api/documents`, `/api/actions`
- Nested resources: `/api/projects/[id]/documents`

**HTTP Methods:**
- `GET` - Retrieve (no side effects)
- `POST` - Create
- `PATCH` - Partial update
- `DELETE` - Remove
- `PUT` - Full replace (avoid, use PATCH)

**Status Codes:**
```typescript
200 - OK (success with body)
201 - Created (resource created)
204 - No Content (success without body, e.g., DELETE)
400 - Bad Request (validation error)
401 - Unauthorized (no/invalid auth)
403 - Forbidden (auth OK but not allowed)
404 - Not Found
429 - Too Many Requests (rate limited)
500 - Internal Server Error (unhandled exception)
```

### Request Validation Pattern

```typescript
// app/api/chat/route.ts
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

// Define schema
const ChatRequestSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  conversationId: z.string().uuid().optional()
})

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await req.json()
    const validated = ChatRequestSchema.parse(body)

    // 2. Authenticate
    const apiKey = req.headers.get('X-Imply-Project-Key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      )
    }

    // 3. Verify project access
    const project = await db.project.findUnique({
      where: { apiKey }
    })

    if (!project || project.id !== validated.projectId) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      )
    }

    // 4. Rate limiting
    await checkRateLimit(project.id)

    // 5. Execute business logic
    const result = await retrieveAndGenerate(
      validated.projectId,
      validated.message,
      validated.conversationId
    )

    // 6. Return response
    return NextResponse.json(result)

  } catch (error) {
    // Handle errors (as shown in Error Handling Pattern)
  }
}
```

### Response Format

```typescript
// types/api.ts
export interface APIResponse<T> {
  data?: T
  error?: {
    message: string
    code: string
    metadata?: Record<string, unknown>
  }
}

// ✅ Success response
{
  "data": {
    "messageId": "msg_123",
    "content": "To reset your password...",
    "sources": [...]
  }
}

// ✅ Error response
{
  "error": {
    "message": "Rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED",
    "metadata": {
      "limit": 1000,
      "resetAt": "2026-02-17T00:00:00Z"
    }
  }
}
```

---

## 8. Database Schema

### Critical: HNSW Vector Index Protection

The `document_chunks_embedding_idx` HNSW index (created in migration `20260217052708_add_pgvector_chunks`) is **not tracked by Prisma** because Prisma does not understand custom index types like `USING hnsw`. As a result, **Prisma will include `DROP INDEX "document_chunks_embedding_idx"` in any migration it generates**.

**Before applying any Prisma migration, always check the SQL and remove any `DROP INDEX "document_chunks_embedding_idx"` line.**

### Prisma Best Practices

**Schema conventions:**
```prisma
// prisma/schema.prisma

// 1. Use camelCase for model names (maps to table_name in DB)
model Project {
  id        String   @id @default(uuid())
  name      String
  apiKey    String   @unique @map("api_key")
  createdAt DateTime @default(now()) @map("created_at")

  documents Document[]

  @@map("projects") // Table name
  @@index([apiKey]) // Index for lookups
}

// 2. Always use UUIDs for IDs
// 3. Always include createdAt, updatedAt where appropriate
// 4. Use explicit relations (no implicit many-to-many)
// 5. Add indexes for foreign keys and frequent lookups
```

**Query patterns:**
```typescript
// ✅ GOOD: Select only needed fields
const project = await db.project.findUnique({
  where: { id: projectId },
  select: {
    id: true,
    name: true,
    systemPrompt: true,
    actions: {
      where: { enabled: true },
      select: { id: true, name: true, description: true }
    }
  }
})

// ❌ BAD: Fetch everything
const project = await db.project.findUnique({
  where: { id: projectId },
  include: { documents: true, actions: true, conversations: true }
})
```

**Transactions for consistency:**
```typescript
// When multiple operations must succeed together
await db.$transaction(async (tx) => {
  const document = await tx.document.create({
    data: { projectId, filename, content }
  })

  await tx.document.update({
    where: { id: document.id },
    data: { embeddingIds: chunkIds }
  })
})
```

---

## 9. External Services Integration

### EmergentDB Integration

**Configuration:**
```typescript
// lib/emergentdb.ts
const emergentDB = new EmergentDBClient({
  url: process.env.EMERGENTDB_URL!,
  timeout: 2000 // 2s max for searches
})

// Fallback behavior
async function searchWithFallback(embedding: number[], options: SearchOptions) {
  try {
    return await emergentDB.search(embedding, options)
  } catch (error) {
    logger.error('EmergentDB search failed, falling back', error)
    // Return empty results, continue without context
    return []
  }
}
```

### Claude API Integration

**Streaming responses:**
```typescript
// lib/claude.ts
export async function* streamChatResponse(
  systemPrompt: string,
  context: string[],
  userMessage: string
): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: buildPrompt(context, userMessage)
    }]
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      yield chunk.delta.text
    }
  }
}

// Usage in API route
export async function POST(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamChatResponse(...)) {
        controller.enqueue(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

### OpenAI Embeddings

**Batch processing:**
```typescript
// lib/embeddings.ts
const BATCH_SIZE = 100

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const batches = chunk(texts, BATCH_SIZE)
  const results: number[][] = []

  for (const batch of batches) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch
    })
    results.push(...response.data.map(d => d.embedding))
  }

  return results
}
```

---

## 10. Error Handling

### Error Hierarchy

```typescript
// lib/errors.ts
export class ImplyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

// Specific error types
export class ValidationError extends ImplyError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, metadata)
  }
}

export class AuthenticationError extends ImplyError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class RateLimitError extends ImplyError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
  }
}

export class EmergentDBError extends ImplyError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'EMERGENTDB_ERROR', statusCode)
  }
}
```

### Logging Strategy

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
})

// Usage
logger.info({ projectId, messageId }, 'Chat message processed')
logger.error({ error, projectId }, 'Failed to generate response')
```

---

## 11. Security

### Input Validation

**ALWAYS validate:**
- ✅ API request bodies (Zod schemas)
- ✅ Query parameters (Zod schemas)
- ✅ File uploads (type, size, content)
- ✅ User-provided URLs (action endpoints)

**Example:**
```typescript
const ActionSchema = z.object({
  name: z.string().min(1).max(50),
  endpoint: z.string().url().refine(
    url => !url.includes('localhost') && !url.includes('127.0.0.1'),
    { message: 'Localhost endpoints not allowed' }
  ),
  method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional()
})
```

### Authentication

**Widget auth (API key):**
```typescript
async function authenticateWidget(req: Request): Promise<Project> {
  const apiKey = req.headers.get('X-Imply-Project-Key')

  if (!apiKey) {
    throw new AuthenticationError('Missing API key')
  }

  const project = await db.project.findUnique({
    where: { apiKey }
  })

  if (!project) {
    throw new AuthenticationError('Invalid API key')
  }

  return project
}
```

**Dashboard auth (session-based):**
```typescript
// Use NextAuth.js or Clerk
import { getServerSession } from 'next-auth'

export async function requireAuth() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/login')
  }

  return session.user
}
```

### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s') // 10 requests per 10 seconds
})

export async function checkRateLimit(identifier: string): Promise<void> {
  const { success, remaining } = await ratelimit.limit(identifier)

  if (!success) {
    throw new RateLimitError(`Rate limit exceeded. ${remaining} remaining.`)
  }
}
```

---

## 12. Testing

### Unit Tests

**Pattern:**
```typescript
// lib/embeddings.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateEmbedding } from './embeddings'

describe('generateEmbedding', () => {
  it('should generate embedding for valid text', async () => {
    const text = 'Hello world'
    const embedding = await generateEmbedding(text)

    expect(embedding).toHaveLength(1536) // text-embedding-3-small dimension
    expect(embedding.every(n => typeof n === 'number')).toBe(true)
  })

  it('should throw error for empty text', async () => {
    await expect(generateEmbedding('')).rejects.toThrow(ValidationError)
  })
})
```

### Integration Tests

**API route testing:**
```typescript
// app/api/chat/route.test.ts
import { describe, it, expect } from 'vitest'
import { POST } from './route'

describe('POST /api/chat', () => {
  it('should return chat response for valid request', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'X-Imply-Project-Key': 'test-key' },
      body: JSON.stringify({
        projectId: 'proj-123',
        message: 'Hello'
      })
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('messageId')
    expect(data).toHaveProperty('content')
  })
})
```

---

## 13. Performance

### Optimization Rules

**1. Database Queries**
- Use `select` to fetch only needed fields
- Add indexes for frequently queried columns
- Use `take` and `skip` for pagination
- Avoid N+1 queries (use `include` strategically)

**2. Caching Strategy**
```typescript
// Cache project config (changes rarely)
import { unstable_cache } from 'next/cache'

const getCachedProject = unstable_cache(
  async (id: string) => db.project.findUnique({ where: { id } }),
  ['project'],
  { revalidate: 3600 } // 1 hour
)
```

**3. Streaming Responses**
- Use Server-Sent Events for chat
- Stream Claude responses (don't wait for full response)
- Stream file uploads (don't buffer in memory)

**4. Bundle Size**
- Use dynamic imports for heavy components
- Avoid importing entire libraries (use tree-shaking)
- Monitor widget.js bundle size (<100KB gzipped)

---

## 14. Deployment

### Environment Variables

**Required:**
```bash
# Database
DATABASE_URL="postgres://..."

# EmergentDB
EMERGENTDB_URL="https://emergentdb.railway.app"

# AI APIs
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Auth (choose one)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://imply.ai"
# OR
CLERK_SECRET_KEY="..."
```

### Vercel Deployment

**Build settings:**
```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "vitest",
    "postinstall": "prisma generate"
  }
}
```

### EmergentDB Deployment (Railway)

**Dockerfile:**
```dockerfile
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release -p api-server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates
COPY --from=builder /app/target/release/api-server /usr/local/bin/
EXPOSE 8080
CMD ["api-server"]
```

---

## APPENDIX: Development Workflow

### Starting New Feature

1. **Understand requirements** - Read design docs
2. **Update CLAUDE.md** - Add any new patterns/decisions
3. **Write types first** - Define interfaces in `types/`
4. **Write tests** - TDD approach where possible
5. **Implement** - Follow patterns in this doc
6. **Test locally** - Verify everything works
7. **Review** - Self-review against this doc
8. **Commit** - Clear, descriptive commit messages

### Code Review Checklist

- [ ] Follows naming conventions
- [ ] No `any` types
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Tests written (unit + integration)
- [ ] Performance considered
- [ ] Security reviewed
- [ ] Documentation updated

---

**END OF CLAUDE.md**

Last updated: 2026-02-16
This document must be kept in sync with codebase evolution.
