import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/** 404 for unmatched routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'not_found', message: 'Resource not found.' });
}

/**
 * Central error handler — the last line of defense. It logs full detail
 * server-side and returns a generic, safe message so raw errors/stack traces
 * never reach the client.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error('Unhandled error', {
    message: (err as Error)?.message,
    stack: (err as Error)?.stack,
  });
  if (res.headersSent) return;
  res
    .status(500)
    .json({ error: 'internal_error', message: 'Something went wrong. Please try again.' });
}
