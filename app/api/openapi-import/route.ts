import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ImplyError } from '@/lib/errors'
import { OpenAPIImportSchema } from '@/lib/validations'
import { parseOpenAPISpec } from '@/lib/openapi-parser'

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
]

function isPrivateHost(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr)
    return PRIVATE_IP_PATTERNS.some(re => re.test(hostname))
  } catch {
    return true
  }
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: 'Validation error', code: 'VALIDATION_ERROR', metadata: { issues: error.issues } } },
      { status: 400 }
    )
  }
  if (error instanceof ImplyError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode }
    )
  }
  console.error('OpenAPI import error:', error)
  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as unknown
    const validated = OpenAPIImportSchema.parse(body)

    let rawSpec: string
    let baseUrl = ''

    if (validated.url !== undefined) {
      if (isPrivateHost(validated.url)) {
        return NextResponse.json(
          { error: { message: 'Private and internal network URLs are not allowed', code: 'FORBIDDEN_URL' } },
          { status: 400 }
        )
      }

      const res = await fetch(validated.url, {
        headers: { Accept: 'application/json, text/plain' },
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        return NextResponse.json(
          { error: { message: `Failed to fetch spec: ${res.statusText}`, code: 'FETCH_FAILED' } },
          { status: 400 }
        )
      }

      rawSpec = await res.text()
      baseUrl = new URL(validated.url).origin
    } else {
      rawSpec = validated.spec!
    }

    // Parse JSON (YAML not yet supported)
    let spec: Record<string, unknown>
    try {
      spec = JSON.parse(rawSpec) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: { message: 'Could not parse spec. Only JSON format is currently supported. Ensure your spec is valid JSON.', code: 'PARSE_ERROR' } },
        { status: 400 }
      )
    }

    // Resolve base URL from spec servers array if not set from URL
    if (!baseUrl) {
      const servers = (spec['servers'] as Array<{ url?: string }> | undefined) ?? []
      baseUrl = servers[0]?.url ?? ''
    }

    if (!baseUrl) {
      return NextResponse.json(
        { error: { message: 'Could not determine base URL. Provide a spec URL or ensure the spec has a servers array with at least one entry.', code: 'NO_BASE_URL' } },
        { status: 400 }
      )
    }

    const candidates = parseOpenAPISpec(spec, baseUrl)

    return NextResponse.json({ data: candidates })
  } catch (error) {
    return errorResponse(error)
  }
}
