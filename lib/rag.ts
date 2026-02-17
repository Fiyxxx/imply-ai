import { Prisma } from '@prisma/client'
import { db } from './db'
import { generateEmbedding } from './embeddings'
import { createEmergentDBClient } from './emergentdb'
import { createClaudeClient } from './claude'
import { NotFoundError } from './errors'
import type { ChatResponse, ActionSuggestion, DocumentSource } from '@/types/api'
import type { ActionDescriptor } from './claude'

interface RetrievalConfig {
  readonly topK: number
  readonly minScore: number
  readonly enabledCollections?: string[]
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

  // 3. Search knowledge base via EmergentDB
  const emergentDB = createEmergentDBClient()
  const searchResults = await emergentDB.search(queryEmbedding, {
    projectId,
    topK: retrievalConfig.topK,
    collections: retrievalConfig.enabledCollections ?? ['all'],
    threshold: retrievalConfig.minScore
  })

  // 4. Build context strings and source references
  const context = searchResults.map(r => r.metadata.content)
  const sources: DocumentSource[] = searchResults.map(r => ({
    documentId: r.metadata.documentId,
    filename: r.metadata.filename,
    content: r.metadata.content,
    score: r.score
  }))

  // 5. Build action descriptors for prompt
  const actionDescriptors: ActionDescriptor[] = project.actions.map(a => ({
    name: a.name,
    description: a.description
  }))

  // 6. Generate response with Claude
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
