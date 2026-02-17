import { Prisma } from '@prisma/client'
import { db } from './db'
import { generateEmbedding } from './embeddings'
import { createClaudeClient } from './claude'
import { NotFoundError } from './errors'
import type { ChatResponse, ActionSuggestion, DocumentSource } from '@/types/api'
import type { ActionDescriptor } from './claude'

interface RetrievalConfig {
  readonly topK: number
  readonly minScore: number
  readonly enabledCollections?: string[]
}

// Shape returned by the raw pgvector similarity query
interface ChunkSearchRow {
  id: string
  documentId: string
  content: string
  filename: string
  collection: string | null
  score: number
}

export interface ParsedAction {
  readonly actionName: string
  readonly parameters: Record<string, unknown>
  readonly explanation: string
}

export function parseActionFromResponse(response: string): ParsedAction | null {
  const actionMatch = response.match(/^ACTION:\s*(\w+)\s*$/m)
  if (!actionMatch) {
    return null
  }

  const paramsMatch = response.match(/^PARAMETERS:\s*(.+)\s*$/m)
  const explanationMatch = response.match(/^EXPLANATION:\s*(.+)\s*$/m)

  let parameters: Record<string, unknown> = {}
  if (paramsMatch?.[1]) {
    try {
      const parsed = JSON.parse(paramsMatch[1].trim()) as unknown
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parameters = parsed as Record<string, unknown>
      }
    } catch {
      // Invalid JSON - use empty object
    }
  }

  return {
    actionName: actionMatch[1]!,
    parameters,
    explanation: explanationMatch?.[1]?.trim() ?? ''
  }
}

/**
 * Search document chunks using pgvector cosine similarity.
 * Uses raw SQL because Prisma doesn't support vector operators natively.
 */
async function searchChunks(
  projectId: string,
  queryEmbedding: number[],
  topK: number,
  minScore: number,
  collections?: string[]
): Promise<ChunkSearchRow[]> {
  const vectorLiteral = `[${queryEmbedding.join(',')}]`

  // Build optional collection filter
  const collectionFilter =
    collections && collections.length > 0 && !collections.includes('all')
      ? Prisma.sql`AND dc.collection = ANY(${collections}::text[])`
      : Prisma.empty

  const rows = await db.$queryRaw<ChunkSearchRow[]>`
    SELECT
      dc.id,
      dc.document_id   AS "documentId",
      dc.content,
      dc.filename,
      dc.collection,
      1 - (dc.embedding <=> ${vectorLiteral}::vector) AS score
    FROM document_chunks dc
    INNER JOIN documents d ON d.id = dc.document_id
    WHERE dc.project_id = ${projectId}
      AND d.enabled    = true
      AND d.status     = 'indexed'
      ${collectionFilter}
    ORDER BY dc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `

  // Filter by minimum score threshold
  return rows.filter(r => Number(r.score) >= minScore)
}

export async function retrieveAndGenerate(
  projectId: string,
  userMessage: string,
  conversationId?: string
): Promise<ChatResponse> {
  // 1. Load project config and enabled actions
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      actions: {
        where: { enabled: true },
        select: {
          id: true,
          name: true,
          description: true,
          requiresConfirmation: true
        }
      }
    }
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  const retrievalConfig = project.retrievalConfig as unknown as RetrievalConfig

  // 2. Generate query embedding
  const queryEmbedding = await generateEmbedding(userMessage)

  // 3. Search knowledge base via pgvector
  const searchResults = await searchChunks(
    projectId,
    queryEmbedding,
    retrievalConfig.topK,
    retrievalConfig.minScore,
    retrievalConfig.enabledCollections
  )

  // 4. Build context strings and source references
  const context = searchResults.map(r => r.content)
  const sources: DocumentSource[] = searchResults.map(r => ({
    documentId: r.documentId,
    filename: r.filename,
    content: r.content,
    score: Number(r.score)
  }))

  // 5. Build action descriptors for prompt
  const actionDescriptors: ActionDescriptor[] = project.actions.map(a => ({
    name: a.name,
    description: a.description
  }))

  // 6. Generate response with Claude/GPT
  const claude = createClaudeClient()
  const responseText = await claude.chat(
    project.systemPrompt,
    context,
    userMessage,
    actionDescriptors
  )

  // 7. Parse for action suggestion
  const parsedAction = parseActionFromResponse(responseText)
  let action: ActionSuggestion | undefined

  if (parsedAction) {
    const matchedAction = project.actions.find(a => a.name === parsedAction.actionName)
    if (matchedAction) {
      action = {
        actionId: matchedAction.id,
        name: matchedAction.name,
        parameters: parsedAction.parameters,
        explanation: parsedAction.explanation,
        requiresConfirmation: matchedAction.requiresConfirmation
      }
    }
  }

  // 8. Ensure conversation exists
  const convoId = conversationId ?? (await createConversation(projectId))

  // 9. Save assistant message
  const message = await db.message.create({
    data: {
      conversationId: convoId,
      role: 'assistant',
      content: responseText,
      sources: sources as unknown as Prisma.InputJsonValue
    }
  })

  // 10. Update conversation timestamp
  await db.conversation.update({
    where: { id: convoId },
    data: { lastMessageAt: new Date() }
  })

  return {
    messageId: message.id,
    conversationId: convoId,
    content: responseText,
    sources,
    action
  }
}

async function createConversation(projectId: string): Promise<string> {
  const conversation = await db.conversation.create({
    data: { projectId }
  })
  return conversation.id
}

/** SSE event payloads streamed from the chat endpoint */
export type StreamEvent =
  | { type: 'sources'; data: DocumentSource[] }
  | { type: 'delta'; text: string }
  | { type: 'done'; messageId: string; conversationId: string }
  | { type: 'action'; action: { kind: 'http'; name: string; requiresConfirmation: boolean } }
  | { type: 'error'; message: string }

/**
 * Same as retrieveAndGenerate but yields SSE-style events so the client
 * can start rendering text before the full response is complete.
 *
 * Yields events:
 *  1. { type: 'sources', data: [...] }  — immediately, before LLM call
 *  2. { type: 'delta', text: '...' }    — per token from the LLM
 *  3. { type: 'done', messageId, conversationId } — after DB write
 */
export async function* retrieveAndGenerateStream(
  projectId: string,
  userMessage: string,
  conversationId?: string
): AsyncGenerator<StreamEvent> {
  // 1. Fetch project config and query embedding in parallel — they're independent,
  //    so the ~80ms DB round-trip overlaps with the ~800ms OpenAI embedding call.
  const [project, queryEmbedding] = await Promise.all([
    db.project.findUnique({
      where: { id: projectId },
      include: {
        actions: {
          where: { enabled: true },
          select: {
            id: true,
            name: true,
            description: true,
            requiresConfirmation: true
          }
        }
      }
    }),
    generateEmbedding(userMessage)
  ])

  if (!project) {
    yield { type: 'error', message: 'Project not found' }
    return
  }

  const retrievalConfig = project.retrievalConfig as unknown as RetrievalConfig

  // 2. Vector search (needs both project config and embedding — runs after both)
  const searchResults = await searchChunks(
    projectId,
    queryEmbedding,
    retrievalConfig.topK,
    retrievalConfig.minScore,
    retrievalConfig.enabledCollections
  )

  const context = searchResults.map(r => r.content)
  const sources: DocumentSource[] = searchResults.map(r => ({
    documentId: r.documentId,
    filename: r.filename,
    content: r.content,
    score: Number(r.score)
  }))

  // 3. Send sources immediately so the client can show them while streaming
  yield { type: 'sources', data: sources }

  const actionDescriptors: ActionDescriptor[] = project.actions.map(a => ({
    name: a.name,
    description: a.description
  }))

  // 4. Stream LLM response
  const claude = createClaudeClient()
  let fullText = ''

  for await (const delta of claude.chatStream(
    project.systemPrompt,
    context,
    userMessage,
    actionDescriptors
  )) {
    fullText += delta
    yield { type: 'delta', text: delta }
  }

  // 5. Emit action event if the LLM suggested one
  const parsedAction = parseActionFromResponse(fullText)
  if (parsedAction) {
    const matchedAction = project.actions.find(a => a.name === parsedAction.actionName)
    if (matchedAction) {
      yield {
        type: 'action',
        action: {
          kind: 'http',
          name: matchedAction.name,
          requiresConfirmation: matchedAction.requiresConfirmation,
        },
      }
    }
  }

  // 6. Persist to DB after stream completes
  // conversationId is always provided by the API route (which creates one if needed)
  if (!conversationId) {
    yield { type: 'error', message: 'Missing conversationId — this is a server bug' }
    return
  }
  const convoId = conversationId

  const message = await db.message.create({
    data: {
      conversationId: convoId,
      role: 'assistant',
      content: fullText,
      sources: sources as unknown as Prisma.InputJsonValue
    }
  })

  await db.conversation.update({
    where: { id: convoId },
    data: { lastMessageAt: new Date() }
  })

  yield { type: 'done', messageId: message.id, conversationId: convoId }
}
