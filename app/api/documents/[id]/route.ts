import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { deleteDocumentChunks } from '@/lib/documents'
import { ImplyError, NotFoundError } from '@/lib/errors'
import { validateProjectAccess } from '@/lib/auth'

function getApiKey(req: NextRequest): string | null {
  return req.headers.get('X-Imply-Project-Key')
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ImplyError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode }
    )
  }
  console.error('Document API error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const document = await db.document.findUnique({ where: { id } })
    if (!document) throw new NotFoundError('Document')

    await validateProjectAccess(getApiKey(req), document.projectId)

    return NextResponse.json({ data: document })

  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const document = await db.document.findUnique({ where: { id } })
    if (!document) throw new NotFoundError('Document')

    await validateProjectAccess(getApiKey(req), document.projectId)

    // Delete chunks from pgvector (cascades via FK, but explicit for clarity)
    await deleteDocumentChunks(id)

    // Then delete document record
    await db.document.delete({ where: { id } })

    return NextResponse.json({ data: { success: true, id } })

  } catch (error) {
    return errorResponse(error)
  }
}
