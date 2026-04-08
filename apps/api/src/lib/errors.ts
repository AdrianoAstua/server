export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details: unknown

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details ?? null
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON(): {
    code: string
    message: string
    details: unknown
  } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service error', details?: unknown) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details)
  }
}
