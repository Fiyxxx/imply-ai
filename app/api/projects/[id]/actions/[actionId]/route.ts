import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
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
        headers: true,
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
    const body = await req.json() as unknown
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
        ...(updates.headers              !== undefined && { headers: updates.headers as Prisma.InputJsonValue }),
        ...(updates.parameters           !== undefined && { parameters: updates.parameters as Prisma.InputJsonValue }),
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
