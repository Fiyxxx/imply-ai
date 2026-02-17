import { describe, it, expect } from 'vitest'
import { extractText, chunkAndEmbed } from './documents'

describe('extractText', () => {
  it('should extract text from markdown', async () => {
    const content = '# Hello\n\nThis is a test.'
    const text = await extractText(content, 'test.md')

    expect(text).toContain('Hello')
    expect(text).toContain('test')
  })

  it('should handle HTML', async () => {
    const content = '<html><body><h1>Hello</h1><p>World</p></body></html>'
    const text = await extractText(content, 'test.html')

    expect(text).toContain('Hello')
    expect(text).toContain('World')
  })

  it('should handle plain text', async () => {
    const content = 'Plain text content here'
    const text = await extractText(content, 'test.txt')

    expect(text).toBe('Plain text content here')
  })

  it('should throw ValidationError for unsupported type', async () => {
    await expect(extractText('content', 'file.xyz')).rejects.toThrow('Unsupported file type')
  })

  it('should throw ValidationError for empty content', async () => {
    await expect(extractText('', 'test.txt')).rejects.toThrow()
  })
})

describe('chunkAndEmbed', () => {
  it('should throw ValidationError for empty text', async () => {
    const { ValidationError } = await import('./errors')
    await expect(
      chunkAndEmbed('doc-id', 'proj-id', '', 'test.txt')
    ).rejects.toThrow(ValidationError)
  })
})
