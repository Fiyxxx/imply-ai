import { describe, it, expect } from 'vitest'
import { parseOpenAPISpec } from './openapi-parser'

const MINIMAL_SPEC = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/tickets': {
      post: {
        operationId: 'create_ticket',
        summary: 'Create a support ticket',
        description: 'Creates a new support ticket',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title:    { type: 'string',  description: 'Ticket title' },
                  priority: { type: 'string',  description: 'P1, P2, or P3' },
                  urgent:   { type: 'boolean', description: 'Mark as urgent' },
                }
              }
            }
          }
        }
      }
    },
    '/tickets/{id}': {
      get: {
        operationId: 'get_ticket',
        summary: 'Get a ticket',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Ticket ID' }
        ]
      }
    }
  }
}

describe('parseOpenAPISpec', () => {
  it('extracts candidate actions from a valid OpenAPI 3 spec', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    expect(result).toHaveLength(2)
  })

  it('maps operationId to name (slugified)', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.name).toBe('create_ticket')
  })

  it('maps summary to displayName', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.displayName).toBe('Create a support ticket')
  })

  it('builds full endpoint URL from server + path', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.endpoint).toBe('https://api.example.com/tickets')
  })

  it('extracts requestBody properties as parameters', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const create = result.find(a => a.method === 'POST')
    expect(create?.parameters).toHaveLength(3)
    const titleParam = create?.parameters.find(p => p.name === 'title')
    expect(titleParam).toMatchObject({ type: 'string', required: true })
  })

  it('extracts path/query parameters', () => {
    const result = parseOpenAPISpec(MINIMAL_SPEC, 'https://api.example.com')
    const get = result.find(a => a.method === 'GET')
    expect(get?.parameters).toHaveLength(1)
    expect(get?.parameters[0]?.name).toBe('id')
  })

  it('falls back to path+method slug when operationId is missing', () => {
    const spec = {
      ...MINIMAL_SPEC,
      paths: { '/users': { get: { summary: 'List users' } } }
    }
    const result = parseOpenAPISpec(spec, 'https://api.example.com')
    expect(result[0]?.name).toBe('get_users')
  })

  it('returns empty array for spec with no paths', () => {
    const result = parseOpenAPISpec({ openapi: '3.0.0', info: {}, paths: {} }, 'https://api.example.com')
    expect(result).toHaveLength(0)
  })

  it('skips unsupported HTTP methods (head, options, trace)', () => {
    const spec = {
      ...MINIMAL_SPEC,
      paths: { '/ping': { head: { summary: 'Ping' }, get: { summary: 'Ping GET' } } }
    }
    const result = parseOpenAPISpec(spec, 'https://api.example.com')
    expect(result).toHaveLength(1)
    expect(result[0]?.method).toBe('GET')
  })

  it('excludes header parameters from extracted parameters', () => {
    const spec = {
      ...MINIMAL_SPEC,
      paths: {
        '/orders': {
          get: {
            operationId: 'list_orders',
            summary: 'List orders',
            parameters: [
              { name: 'X-Tenant-Id', in: 'header', required: true, schema: { type: 'string' }, description: 'Tenant header' },
              { name: 'page', in: 'query', required: false, schema: { type: 'number' }, description: 'Page number' },
            ]
          }
        }
      }
    }
    const result = parseOpenAPISpec(spec, 'https://api.example.com')
    expect(result).toHaveLength(1)
    // Should only have the query param, not the header param
    expect(result[0]?.parameters).toHaveLength(1)
    expect(result[0]?.parameters[0]?.name).toBe('page')
  })

  it('falls back description through summary then name when description is absent', () => {
    const spec = {
      ...MINIMAL_SPEC,
      paths: {
        '/ping': {
          get: {
            operationId: 'ping',
            // no description field
            summary: 'Health check'
          }
        }
      }
    }
    const result = parseOpenAPISpec(spec, 'https://api.example.com')
    expect(result[0]?.description).toBe('Health check') // falls back to summary

    const specNoSummary = {
      ...MINIMAL_SPEC,
      paths: {
        '/ping': {
          get: {
            operationId: 'ping_bare'
            // no description, no summary
          }
        }
      }
    }
    const result2 = parseOpenAPISpec(specNoSummary, 'https://api.example.com')
    expect(result2[0]?.description).toBe('ping_bare') // falls back to name
  })
})
