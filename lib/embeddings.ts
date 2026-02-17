import OpenAI from 'openai'
import { ValidationError } from './errors'

let _openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return _openai
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_BATCH_SIZE = 100

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new ValidationError('Text cannot be empty')
  }

  try {
    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim()
    })

    const embedding = response.data[0]?.embedding
    if (!embedding) {
      throw new ValidationError('No embedding returned from OpenAI')
    }

    return embedding
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error(`Failed to generate embedding: ${String(error)}`)
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  // Process in batches to stay within API limits
  const batches: string[][] = []
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    batches.push(texts.slice(i, i + EMBEDDING_BATCH_SIZE))
  }

  const allEmbeddings: number[][] = []

  for (const batch of batches) {
    try {
      const response = await getOpenAIClient().embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch
      })

      const embeddings = response.data.map(d => d.embedding)
      allEmbeddings.push(...embeddings)
    } catch (error) {
      throw new Error(`Failed to generate embeddings batch: ${String(error)}`)
    }
  }

  return allEmbeddings
}

export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const words = text.trim().split(/\s+/)
  const chunks: string[] = []
  const step = chunkSize - overlap

  for (let i = 0; i < words.length; i += step) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) {
      chunks.push(chunk)
    }
  }

  return chunks
}
