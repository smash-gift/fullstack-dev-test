import type { Request, Response, NextFunction, RequestHandler } from "express";
import AppError from "../errors/AppError";

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

interface HitEntry {
  count: number;
  windowStart: number;
}

export function createRateLimiter({
  windowMs,
  max,
}: RateLimiterOptions): RequestHandler {
  const hits = new Map<string, HitEntry>();

  return function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      hits.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (entry.count >= max) {
      next(
        new AppError({
          status: 429,
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
        }),
      );
      return;
    }

    entry.count += 1;
    next();
  };
}

export default createRateLimiter;
