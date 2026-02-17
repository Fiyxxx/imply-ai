import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { ImplyError } from '@/lib/errors'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100)
})

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
  console.error('Projects API error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { name } = CreateProjectSchema.parse(body)

    const apiKey = `imply_${randomUUID().replace(/-/g, '')}`

    const project = await db.project.create({
      data: {
        name,
        apiKey,
        retrievalConfig: { topK: 5, minScore: 0.7 }
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        createdAt: true
      }
    })

    return NextResponse.json({ data: project }, { status: 201 })

  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const projects = await db.project.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            conversations: true,
            actions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: projects })

  } catch (error) {
    return errorResponse(error)
  }
}
