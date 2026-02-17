import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { db } from '@/lib/db'
import { extractText, chunkAndEmbed } from '@/lib/documents'
import { ImplyError, ValidationError } from '@/lib/errors'
import { validateProjectAccess } from '@/lib/auth'
import { DocumentStatus } from '@prisma/client'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.md', '.markdown', '.html', '.htm', '.txt'])

const UploadQuerySchema = z.object({
  projectId: z.string().uuid()
})

function getApiKey(req: NextRequest): string | null {
  return req.headers.get('X-Imply-Project-Key')
}

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
  console.error('Documents API error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')
    const collection = (formData.get('collection') as string | null) ?? 'default'

    if (!(file instanceof File)) {
      throw new ValidationError('file field is required and must be a file')
    }
    if (typeof projectId !== 'string' || !projectId) {
      throw new ValidationError('projectId is required')
    }

    await validateProjectAccess(getApiKey(req), projectId)

    const filename = file.name
    const ext = '.' + (filename.split('.').pop()?.toLowerCase() ?? '')

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new ValidationError(`Unsupported file type: ${ext}. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`)
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File too large (max 10MB)')
    }

    // Create document record in processing state
    const document = await db.document.create({
      data: {
        projectId,
        filename,
        content: '',
        collection,
        status: DocumentStatus.processing,
        embeddingIds: []
      }
    })

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await extractText(buffer, filename)

      await db.document.update({
        where: { id: document.id },
        data: { content: text }
      })

      const result = await chunkAndEmbed(document.id, projectId, text, filename, collection)

      await db.document.update({
        where: { id: document.id },
        data: {
          embeddingIds: result.embeddingIds,
          status: DocumentStatus.indexed
        }
      })

      return NextResponse.json({
        data: {
          documentId: document.id,
          filename,
          status: DocumentStatus.indexed,
          chunks: result.chunks.length
        }
      }, { status: 201 })

    } catch (processingError) {
      await db.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.failed,
          errorMessage: processingError instanceof Error ? processingError.message : 'Unknown processing error'
        }
      })
      throw processingError
    }

  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const params = UploadQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    )

    await validateProjectAccess(getApiKey(req), params.projectId)

    const documents = await db.document.findMany({
      where: { projectId: params.projectId },
      select: {
        id: true,
        filename: true,
        collection: true,
        enabled: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: documents })

  } catch (error) {
    return errorResponse(error)
  }
}
