import { describe, it, expect } from 'vitest'
import { generateEmbedding, generateEmbeddings, chunkText } from './embeddings'

describe('chunkText', () => {
  it('should split text into chunks', () => {
    const words = Array(600).fill('word').join(' ')
    const chunks = chunkText(words, 500, 50)

    expect(chunks.length).toBeGreaterThan(1)
  })

  it('should return single chunk for short text', () => {
    const text = 'Hello world'
    const chunks = chunkText(text, 500, 50)

    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe('Hello world')
  })

  it('should handle empty text', () => {
    const chunks = chunkText('', 500, 50)
    expect(chunks).toHaveLength(0)
  })
})

describe('generateEmbedding', () => {
  it('should throw error for empty text', async () => {
    await expect(generateEmbedding('')).rejects.toThrow()
  })

  it('should throw error for whitespace-only text', async () => {
    await expect(generateEmbedding('   ')).rejects.toThrow()
  })
})

describe('generateEmbeddings', () => {
  it('should return empty array for empty input', async () => {
    const embeddings = await generateEmbeddings([])
    expect(embeddings).toHaveLength(0)
  })
})
