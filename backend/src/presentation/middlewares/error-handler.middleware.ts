import type { NextFunction, Request, Response } from 'express';

import { DomainError, LlmError, ValidationError } from '../../domain/errors/index.js';
import type { Logger } from '../../pkg/logger/logger.js';
import { failure } from '../../pkg/response/http-response.js';

/** Maps a domain error code to its HTTP status. */
const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  METHOD_NOT_ALLOWED: 405,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  NOT_FOUND: 404,
};

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

/**
 * The last middleware, and the only place an error becomes a response.
 *
 * The final branch is what enforces the brief's requirement that raw errors
 * never reach the client: an exception nobody anticipated still leaves as a
 * generic INTERNAL_ERROR, with the stack going to the log instead.
 */
export function errorHandlerMiddleware(logger: Logger) {
  return (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const meta = { requestId: req.requestId, timestamp: new Date().toISOString() };

    if (error instanceof ValidationError) {
      logger.warn({ requestId: req.requestId, issues: error.issues }, 'request validation failed');
      res.status(400).json(failure(error.code, error.message, meta, error.issues));
      return;
    }

    // Since phase 04 the use case degrades instead of throwing, so this branch
    // is a backstop rather than a live path. It stays because an LLM error must
    // never carry the provider name or the upstream reason to the client: those
    // identify our vendor and echo internal state. The log keeps them.
    if (error instanceof LlmError) {
      logger.error(
        { requestId: req.requestId, code: error.code, reason: error.degradationReason },
        error.message,
      );
      res.status(500).json(failure('INTERNAL_ERROR', 'An unexpected error occurred.', meta));
      return;
    }

    if (error instanceof DomainError) {
      const status = STATUS_BY_CODE[error.code] ?? 500;
      logger.warn({ requestId: req.requestId, code: error.code }, error.message);
      res.status(status).json(failure(error.code, error.message, meta));
      return;
    }

    // Malformed JSON and oversized bodies surface as body-parser errors.
    const parserError = error as BodyParserError;
    if (parserError?.type === 'entity.parse.failed') {
      logger.warn({ requestId: req.requestId }, 'malformed JSON body');
      res.status(400).json(failure('VALIDATION_ERROR', 'Request body is not valid JSON', meta));
      return;
    }
    if (parserError?.type === 'entity.too.large') {
      logger.warn({ requestId: req.requestId }, 'request body too large');
      res.status(413).json(failure('PAYLOAD_TOO_LARGE', 'Request body is too large', meta));
      return;
    }

    logger.error(
      { requestId: req.requestId, err: error },
      'unhandled error while processing request',
    );
    res.status(500).json(failure('INTERNAL_ERROR', 'An unexpected error occurred.', meta));
  };
}
