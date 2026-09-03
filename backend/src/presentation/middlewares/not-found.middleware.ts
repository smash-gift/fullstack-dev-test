import type { Request, Response } from 'express';

import { failure } from '../../pkg/response/http-response.js';

export function notFoundMiddleware() {
  return (req: Request, res: Response): void => {
    res.status(404).json(
      failure('NOT_FOUND', 'Route not found', {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      }),
    );
  };
}
