import { randomUUID } from 'crypto'
import { marked } from 'marked'
import { db } from './db'
import { generateEmbeddings, chunkText } from './embeddings'
import { ValidationError } from './errors'

const ALLOWED_EXTENSIONS = new Set(['md', 'markdown', 'html', 'htm', 'txt', 'pdf'])

export async function extractText(
  content: string | Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() ?? ''

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ValidationError(`Unsupported file type: .${ext}`)
  }

  const text = content.toString()

  if (!text.trim()) {
    throw new ValidationError('Content cannot be empty')
  }

  try {
    switch (ext) {
      case 'md':
      case 'markdown':
        return stripMarkdown(text)

      case 'html':
      case 'htm':
        return stripHtml(text)

      case 'txt':
        return text

      case 'pdf':
        if (Buffer.isBuffer(content)) {
          const { PDFParse } = await import('pdf-parse')
          const parser = new PDFParse({ data: content })
          const result = await parser.getText()
          return result.text
        }
        throw new ValidationError('PDF content must be provided as a Buffer')

      default:
        throw new ValidationError(`Unsupported file type: .${ext}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error(`Failed to extract text from ${filename}: ${String(error)}`)
  }
}

function stripMarkdown(text: string): string {
  const html = marked.parse(text) as string
  return stripHtml(html)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ProcessedDocument {
  readonly chunks: string[]
  readonly chunkCount: number
}

/**
 * Chunk, embed, and store document chunks in Postgres via pgvector.
 * The `embedding` column uses Unsupported("vector(1536)") so inserts
 * must go through $executeRaw with the ::vector cast.
 */
export async function chunkAndEmbed(
  documentId: string,
  projectId: string,
  text: string,
  filename: string,
  collection: string = 'default'
): Promise<ProcessedDocument> {
  const chunks = chunkText(text, 500, 50)

  if (chunks.length === 0) {
    throw new ValidationError('Document produced no text chunks')
  }

  const embeddings = await generateEmbeddings(chunks)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = embeddings[i]

    if (!chunk || !embedding) continue

    const id = randomUUID()
    const vectorLiteral = `[${embedding.join(',')}]`

    // Raw insert required because Prisma can't set Unsupported("vector") fields
    await db.$executeRaw`
      INSERT INTO document_chunks (id, document_id, project_id, content, embedding, collection, chunk_index, filename, created_at)
      VALUES (
        ${id},
        ${documentId},
        ${projectId},
        ${chunk},
        ${vectorLiteral}::vector,
        ${collection},
        ${i},
        ${filename},
        NOW()
      )
    `
  }

  return { chunks, chunkCount: chunks.length }
}

/**
 * Delete all chunks for a document. Uses the ORM (no embedding access needed).
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await db.documentChunk.deleteMany({ where: { documentId } })
}
