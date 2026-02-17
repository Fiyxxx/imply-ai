import { describe, it, expect } from 'vitest'
import { ClaudeClient, buildPrompt } from './claude'

describe('buildPrompt', () => {
  it('should include system prompt', () => {
    const prompt = buildPrompt(
      'You are a helpful assistant.',
      [],
      'Hello',
      []
    )
    expect(prompt).toContain('You are a helpful assistant.')
  })

  it('should include context items', () => {
    const prompt = buildPrompt(
      'System',
      ['Context item 1', 'Context item 2'],
      'Question',
      []
    )
    expect(prompt).toContain('Context item 1')
    expect(prompt).toContain('Context item 2')
  })

  it('should include available actions', () => {
    const prompt = buildPrompt(
      'System',
      [],
      'Question',
      [{ name: 'cancel_sub', description: 'Cancel a subscription' }]
    )
    expect(prompt).toContain('cancel_sub')
    expect(prompt).toContain('Cancel a subscription')
  })

  it('should include user message', () => {
    const prompt = buildPrompt('System', [], 'What is the meaning of life?', [])
    expect(prompt).toContain('What is the meaning of life?')
  })
})

describe('ClaudeClient', () => {
  it('should instantiate without throwing', () => {
    // Should not throw even without ANTHROPIC_API_KEY (lazy init)
    expect(() => new ClaudeClient()).not.toThrow()
  })
})
