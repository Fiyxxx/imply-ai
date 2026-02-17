import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { db } from '@/lib/db'
import { ImplyError, NotFoundError } from '@/lib/errors'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  systemPrompt: z.string().optional(),
  customInstructions: z.string().optional(),
  retrievalConfig: z.object({
    topK: z.number().int().min(1).max(20),
    minScore: z.number().min(0).max(1)
  }).optional()
}).strict()

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
  console.error('Projects [id] API error:', error)
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
      select: {
        id: true,
        name: true,
        apiKey: true,
        systemPrompt: true,
        customInstructions: true,
        retrievalConfig: true,
        config: true,
        createdAt: true
      }
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    return NextResponse.json({ data: project })

  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await req.json()
    const updates = UpdateProjectSchema.parse(body)

    const existing = await db.project.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existing) {
      throw new NotFoundError('Project')
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.systemPrompt !== undefined && { systemPrompt: updates.systemPrompt }),
        ...(updates.customInstructions !== undefined && { customInstructions: updates.customInstructions }),
        ...(updates.retrievalConfig !== undefined && { retrievalConfig: updates.retrievalConfig })
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        systemPrompt: true,
        customInstructions: true,
        retrievalConfig: true,
        config: true,
        createdAt: true
      }
    })

    return NextResponse.json({ data: project })

  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const existing = await db.project.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existing) {
      throw new NotFoundError('Project')
    }

    await db.project.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } }, { status: 200 })

  } catch (error) {
    return errorResponse(error)
  }
}
