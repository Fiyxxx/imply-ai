import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { MessageRole } from '@prisma/client'
import { ChatRequestSchema } from '@/lib/validations'
import { retrieveAndGenerateStream } from '@/lib/rag'
import { validateProjectAccess } from '@/lib/auth'
import { ImplyError } from '@/lib/errors'
import { db } from '@/lib/db'

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest): Promise<Response> {
  let validated: { projectId: string; message: string; conversationId?: string }
  let conversationId: string

  try {
    const body: unknown = await req.json()
    validated = ChatRequestSchema.parse(body)

    const apiKey = req.headers.get('X-Imply-Project-Key')
    await validateProjectAccess(apiKey, validated.projectId)

    // Assign or generate a conversation ID without waiting for the DB.
    // We generate a UUID here so the insert can be fire-and-forget —
    // by the time the assistant message is saved (after streaming), both
    // the conversation row and the user message row will exist.
    conversationId = validated.conversationId ?? randomUUID()

    if (!validated.conversationId) {
      // Fire-and-forget: saves ~60ms of blocking time
      void db.conversation
        .create({ data: { id: conversationId, projectId: validated.projectId } })
        .catch((err: unknown) => console.error('Failed to persist conversation:', err))
    }

    // Fire-and-forget: saves another ~60ms
    void db.message
      .create({ data: { conversationId, role: MessageRole.user, content: validated.message } })
      .catch((err: unknown) => console.error('Failed to persist user message:', err))

  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: { message: 'Validation error', code: 'VALIDATION_ERROR', metadata: { issues: error.issues } } },
        { status: 400 }
      )
    }
    if (error instanceof ImplyError) {
      return Response.json(
        { error: { message: error.message, code: error.code, metadata: error.metadata } },
        { status: error.statusCode }
      )
    }
    console.error('Chat API setup error:', error)
    return Response.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }

  // Stream the RAG + LLM response as SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const enqueue = (data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(data)))

      try {
        for await (const event of retrieveAndGenerateStream(
          validated.projectId,
          validated.message,
          conversationId
        )) {
          enqueue(event)
        }
      } catch (err) {
        console.error('Chat stream error:', err)
        enqueue({ type: 'error', message: 'Stream failed' })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
}
