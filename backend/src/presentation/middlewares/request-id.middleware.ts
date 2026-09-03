import type { NextFunction, Request, Response } from 'express';

import { createId } from '../../pkg/utils/id.js';

/**
 * Attaches a correlation id to every request and echoes it back in a header.
 *
 * This id is what lets a user report an opaque reference and support find the
 * full event in the logs — diagnosis without exposing internals.
 */
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.requestId = createId('req');
    res.setHeader('X-Request-Id', req.requestId);
    next();
  };
}
