import type { Request, Response, NextFunction, RequestHandler } from 'express';

export interface CorsOptions {
  origin: string;
}

const ALLOWED_METHODS = 'POST,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,Authorization';

export function createCorsMiddleware({ origin }: CorsOptions): RequestHandler {
  return function cors(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}

export default createCorsMiddleware;
