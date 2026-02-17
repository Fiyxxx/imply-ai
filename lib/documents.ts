import { marked } from 'marked'
import { generateEmbeddings, chunkText } from './embeddings'
import { createEmergentDBClient } from './emergentdb'
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
  readonly embeddings: number[][]
  readonly embeddingIds: string[]
}

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
  const client = createEmergentDBClient()
  const embeddingIds: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = embeddings[i]

    if (!chunk || !embedding) continue

    const embeddingId = `${documentId}_chunk_${i}`

    await client.insert(embeddingId, embedding, {
      documentId,
      projectId,
      content: chunk,
      filename,
      collection,
      chunkIndex: i
    })

    embeddingIds.push(embeddingId)
  }

  return { chunks, embeddings, embeddingIds }
}

export async function deleteDocumentEmbeddings(
  embeddingIds: readonly string[]
): Promise<void> {
  const client = createEmergentDBClient()

  for (const id of embeddingIds) {
    await client.delete(id)
  }
}
