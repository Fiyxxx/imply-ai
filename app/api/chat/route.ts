import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { MessageRole } from '@prisma/client'
import { ChatRequestSchema } from '@/lib/validations'
import { retrieveAndGenerate } from '@/lib/rag'
import { validateProjectAccess } from '@/lib/auth'
import { ImplyError } from '@/lib/errors'
import { db } from '@/lib/db'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()
    const validated = ChatRequestSchema.parse(body)

    const apiKey = req.headers.get('X-Imply-Project-Key')
    await validateProjectAccess(apiKey, validated.projectId)

    // Create conversation if not provided
    let conversationId = validated.conversationId
    if (!conversationId) {
      const conversation = await db.conversation.create({
        data: { projectId: validated.projectId }
      })
      conversationId = conversation.id
    }

    // Save user message
    await db.message.create({
      data: {
        conversationId,
        role: MessageRole.user,
        content: validated.message
      }
    })

    // Generate response via RAG
    const result = await retrieveAndGenerate(
      validated.projectId,
      validated.message,
      conversationId
    )

    return NextResponse.json({ data: result })

  } catch (error) {
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

    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
