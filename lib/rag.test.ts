import { describe, it, expect, vi } from 'vitest'

// Mock db to prevent PrismaClient instantiation during import
vi.mock('./db', () => ({ db: {} }))

import { parseActionFromResponse } from './rag'

describe('parseActionFromResponse', () => {
  it('should parse action from response text', () => {
    const response = `Here is the answer.

ACTION: cancel_subscription
PARAMETERS: {"subscriptionId": "sub_123"}
EXPLANATION: I will cancel your subscription.`

    const action = parseActionFromResponse(response)

    expect(action).not.toBeNull()
    expect(action?.actionName).toBe('cancel_subscription')
    expect(action?.parameters).toEqual({ subscriptionId: 'sub_123' })
    expect(action?.explanation).toBe('I will cancel your subscription.')
  })

  it('should return null when no action present', () => {
    const response = 'Here is the answer to your question.'
    const action = parseActionFromResponse(response)
    expect(action).toBeNull()
  })

  it('should handle action with no parameters gracefully', () => {
    const response = `Answer.

ACTION: logout
PARAMETERS: {}
EXPLANATION: Logging you out.`

    const action = parseActionFromResponse(response)
    expect(action).not.toBeNull()
    expect(action?.parameters).toEqual({})
  })

  it('should handle malformed PARAMETERS json gracefully', () => {
    const response = `Answer.

ACTION: do_thing
PARAMETERS: not valid json
EXPLANATION: Doing the thing.`

    const action = parseActionFromResponse(response)
    expect(action).not.toBeNull()
    expect(action?.parameters).toEqual({})
  })
})
