import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
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
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return NextResponse.json(
      { error: { message: 'An action with that name already exists in this project', code: 'CONFLICT' } },
      { status: 409 }
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
        // headers intentionally excluded (contains credentials)
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
    const body = await req.json() as unknown
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
        headers:              validated.headers as Prisma.InputJsonValue,
        parameters:           validated.parameters as Prisma.InputJsonValue,
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
