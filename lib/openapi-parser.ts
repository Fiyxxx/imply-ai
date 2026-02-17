import type { CandidateAction, ActionParameter } from '@/types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

interface OpenAPIOperation {
  operationId?: string
  summary?: string
  description?: string
  parameters?: Array<{
    name: string
    in: string
    required?: boolean
    schema?: { type?: string }
    description?: string
  }>
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: {
          type?: string
          required?: string[]
          properties?: Record<string, { type?: string; description?: string }>
        }
      }
    }
  }
}

interface OpenAPISpec {
  servers?: Array<{ url: string }>
  paths?: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .slice(0, 64)
    .replace(/_+$/, '')
}

function resolveType(raw: string | undefined): 'string' | 'number' | 'boolean' {
  if (raw === 'number' || raw === 'integer') return 'number'
  if (raw === 'boolean') return 'boolean'
  return 'string'
}

function extractParameters(op: OpenAPIOperation): ActionParameter[] {
  const params: ActionParameter[] = []
  const requiredBodyFields = new Set<string>(
    op.requestBody?.content?.['application/json']?.schema?.required ?? []
  )

  // Path/query parameters (skip header params — those go in Action.headers)
  for (const p of op.parameters ?? []) {
    if (p.in === 'header') continue
    params.push({
      name:        p.name,
      type:        resolveType(p.schema?.type),
      description: p.description ?? p.name,
      required:    p.required ?? false,
    })
  }

  // Request body properties
  const bodyProps =
    op.requestBody?.content?.['application/json']?.schema?.properties ?? {}
  for (const [name, prop] of Object.entries(bodyProps)) {
    params.push({
      name,
      type:        resolveType(prop.type),
      description: prop.description ?? name,
      required:    requiredBodyFields.has(name),
    })
  }

  return params
}

export function parseOpenAPISpec(
  spec: OpenAPISpec,
  baseUrl: string
): CandidateAction[] {
  const results: CandidateAction[] = []
  const base = baseUrl.replace(/\/$/, '')

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of SUPPORTED_METHODS) {
      const opRaw = (pathItem as Record<string, unknown>)[method.toLowerCase()]
      if (opRaw === undefined || opRaw === null || typeof opRaw !== 'object') continue

      const op = opRaw as OpenAPIOperation
      const name = op.operationId
        ? slugify(op.operationId)
        : slugify(`${method}_${path}`)

      results.push({
        name,
        displayName:  op.summary ?? name,
        description:  op.description ?? op.summary ?? name,
        method,
        endpoint:     `${base}${path}`,
        parameters:   extractParameters(op),
      })
    }
  }

  return results
}
