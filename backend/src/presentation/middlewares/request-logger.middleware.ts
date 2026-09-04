import type { NextFunction, Request, Response } from 'express';

import type { Logger } from '../../pkg/logger/logger.js';

/**
 * One log line per completed request.
 *
 * Deliberately logs no request body: `occasion` and `relationship` are free
 * text and may contain personal data the user typed. Those values only appear
 * at debug level, which production does not run.
 */
export function requestLoggerMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
        },
        'request completed',
      );
    });

    next();
  };
}
