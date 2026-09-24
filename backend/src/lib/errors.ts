/**
 * Domain error hierarchy. The global error handler maps each type to an HTTP
 * status + safe client code, so raw errors never leak to the client.
 */

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'RATE_LIMITED'
  | 'LLM_TIMEOUT'
  | 'LLM_RATE_LIMITED'
  | 'LLM_UNAVAILABLE'
  | 'LLM_INVALID_RESPONSE'
  | 'INTERNAL';

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly statusCode: number;
  /** Whether the failure is transient and worth retrying. */
  readonly retryable: boolean = false;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** Client sent an invalid payload. */
export class InvalidInputError extends AppError {
  readonly code = 'INVALID_INPUT' as const;
  readonly statusCode = 400;
}

/** The LLM call exceeded the configured timeout. Transient. */
export class LlmTimeoutError extends AppError {
  readonly code = 'LLM_TIMEOUT' as const;
  readonly statusCode = 504;
  override readonly retryable = true;
}

/** The LLM provider returned 429 (quota / rate limit). Transient. */
export class LlmRateLimitError extends AppError {
  readonly code = 'LLM_RATE_LIMITED' as const;
  readonly statusCode = 503;
  override readonly retryable = true;
}

/** The LLM provider is unavailable (5xx / network). Transient. */
export class LlmUnavailableError extends AppError {
  readonly code = 'LLM_UNAVAILABLE' as const;
  readonly statusCode = 503;
  override readonly retryable = true;
}

/** The LLM returned an empty / malformed / unparseable response. Not retryable. */
export class LlmInvalidResponseError extends AppError {
  readonly code = 'LLM_INVALID_RESPONSE' as const;
  readonly statusCode = 502;
}

/** Fallback for unexpected errors. */
export class InternalError extends AppError {
  readonly code = 'INTERNAL' as const;
  readonly statusCode = 500;
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
