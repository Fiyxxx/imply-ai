import { describe, it, expect, beforeAll } from 'vitest'
import { EmergentDBClient } from './emergentdb'

describe('EmergentDBClient', () => {
  let client: EmergentDBClient

  beforeAll(() => {
    client = new EmergentDBClient({
      url: process.env.EMERGENTDB_URL || 'http://localhost:8080'
    })
  })

  it('should initialize with URL', () => {
    expect(client).toBeDefined()
  })

  it('should throw error if URL is missing', () => {
    expect(() => new EmergentDBClient({ url: '' })).toThrow('EMERGENTDB_URL is required')
  })
})
