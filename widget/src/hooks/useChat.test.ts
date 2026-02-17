import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseSSELine } from './useChat'

describe('parseSSELine', () => {
  it('returns null for empty line', () => {
    expect(parseSSELine('')).toBeNull()
  })

  it('returns null for lines without data: prefix', () => {
    expect(parseSSELine('event: something')).toBeNull()
  })

  it('parses a delta event', () => {
    const line = 'data: {"type":"delta","text":"hello"}'
    expect(parseSSELine(line)).toEqual({ type: 'delta', text: 'hello' })
  })

  it('parses a done event', () => {
    const line = 'data: {"type":"done","messageId":"m1","conversationId":"c1"}'
    expect(parseSSELine(line)).toEqual({ type: 'done', messageId: 'm1', conversationId: 'c1' })
  })

  it('parses a sources event', () => {
    const line = 'data: {"type":"sources","data":[{"filename":"doc.pdf","score":0.9}]}'
    const result = parseSSELine(line)
    expect(result?.type).toBe('sources')
  })

  it('parses a navigate action event', () => {
    const line = 'data: {"type":"action","action":{"kind":"navigate","url":"/billing"}}'
    expect(parseSSELine(line)).toEqual({
      type: 'action',
      action: { kind: 'navigate', url: '/billing' }
    })
  })

  it('parses an open_tab action event', () => {
    const line = 'data: {"type":"action","action":{"kind":"open_tab","url":"https://docs.example.com"}}'
    const result = parseSSELine(line)
    expect(result).toEqual({
      type: 'action',
      action: { kind: 'open_tab', url: 'https://docs.example.com' }
    })
  })

  it('returns null for malformed JSON', () => {
    expect(parseSSELine('data: {broken')).toBeNull()
  })
})
