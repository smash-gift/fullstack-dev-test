import type { NextFunction, Request, Response } from 'express';

import { DomainError } from '../../domain/errors/index.js';

/** Methods that carry a body in this API. */
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/**
 * The caller sent a body in a format this API does not read.
 *
 * Separate from ValidationError because the fix is different: the caller has
 * to change a header, not a field.
 */
export class UnsupportedMediaTypeError extends DomainError {
  readonly code = 'UNSUPPORTED_MEDIA_TYPE';

  constructor(received: string | undefined) {
    super(
      received === undefined
        ? 'Content-Type header is required and must be application/json'
        : `Content-Type ${received} is not supported; use application/json`,
    );
  }
}

/**
 * Rejects a body that is not JSON, before the schema ever sees it.
 *
 * Without this, `express.json()` silently skips a body whose Content-Type it
 * does not recognise, leaving `req.body` empty — and the caller gets
 * "occasion is required" for a request that did send `occasion`. That answer
 * is worse than an error: it points at the wrong thing and costs the caller
 * an afternoon.
 *
 * The security value is secondary but real: it closes the door on a body
 * being interpreted by some other parser added later.
 */
export function contentTypeMiddleware() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!BODY_METHODS.has(req.method)) {
      next();
      return;
    }

    // A body-less POST is the schema's business, not this middleware's: the
    // caller forgot the payload, and "occasion is required" says that better
    // than a media type complaint would. Note that `Content-Length: 0` counts
    // as no body — an empty body has no format to reject.
    const declaredLength = Number(req.headers['content-length'] ?? '0');
    const hasBody = declaredLength > 0 || req.headers['transfer-encoding'] !== undefined;
    if (!hasBody) {
      next();
      return;
    }

    if (!req.is('application/json')) {
      next(new UnsupportedMediaTypeError(req.headers['content-type']));
      return;
    }

    next();
  };
}
