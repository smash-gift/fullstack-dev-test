import type { SuggestionResult } from '../domain/types';
import type { HttpResponse } from './types';

export const ErrorCode = {
  InvalidInput: 'INVALID_INPUT',
  Unauthorized: 'UNAUTHORIZED',
  RateLimited: 'RATE_LIMITED',
  MethodNotAllowed: 'METHOD_NOT_ALLOWED',
  InternalError: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * The only way an error leaves this service.
 *
 * Callers pass a message they have written themselves — never a provider
 * message and never an exception. That is what keeps stack traces, upstream
 * error text, and anything resembling a key out of the response body.
 */
export function sendError(
  res: HttpResponse,
  status: number,
  code: ErrorCodeValue,
  message: string,
): void {
  res.status(status).json({ error: { code, message } });
}

export function sendSuggestions(res: HttpResponse, result: SuggestionResult): void {
  res.status(200).json(result);
}
