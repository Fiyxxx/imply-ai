export class ImplyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ImplyError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, metadata)
  }
}

export class AuthenticationError extends ImplyError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends ImplyError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NotFoundError extends ImplyError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class RateLimitError extends ImplyError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
  }
}

export class EmergentDBError extends ImplyError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'EMERGENTDB_ERROR', statusCode)
  }
}

export class ClaudeAPIError extends ImplyError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'CLAUDE_API_ERROR', statusCode)
  }
}
