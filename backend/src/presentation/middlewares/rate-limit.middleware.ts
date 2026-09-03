import type { Request, RequestHandler } from 'express';
import rateLimit, { type RateLimitInfo } from 'express-rate-limit';

import { RateLimitedError } from '../../domain/errors/index.js';

export interface RateLimitOptions {
  readonly windowMs: number;
  readonly max: number;
}

/**
 * Caps how many requests one client IP may spend in a window.
 *
 * Mounted **before** the body parser and the controller, which is the whole
 * point: a blocked request costs zero tokens. A limiter placed after the use
 * case would protect the process and not the budget.
 *
 * `express-rate-limit` is wrapped here rather than used directly across the
 * app: the rest of the code sees an Express handler and our own domain error,
 * so swapping the library — or the in-memory store for Redis, which is the
 * documented next step for multiple instances — touches this file only.
 *
 * The counter lives in this process's memory. With N replicas the effective
 * limit becomes 30xN; that limitation is accepted and recorded in ADR-0005.
 */
export function rateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,

    // draft-6 spells the budget out in three readable headers
    // (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) instead of
    // packing them into one. A caller debugging a 429 reads them at a glance.
    standardHeaders: 'draft-6',
    legacyHeaders: false,

    // Errors leave through the one error handler, so a 429 has the same body
    // shape as every other failure and the client needs no special case.
    handler: (req, _res, next) => {
      const reset = readRateLimitInfo(req)?.resetTime;
      next(new RateLimitedError(retryAfterSeconds(reset, options.windowMs)));
    },
  });
}

/**
 * The library attaches its counters to `req.rateLimit` but does not augment
 * Express's `Request` globally, because the property name is configurable.
 * Reading it through a narrow local shape keeps that detail from leaking into
 * the rest of the application's types.
 */
function readRateLimitInfo(req: Request): RateLimitInfo | undefined {
  return (req as Request & { rateLimit?: RateLimitInfo }).rateLimit;
}

/**
 * Always at least one second: `Retry-After: 0` reads as "retry immediately",
 * which is the opposite of the instruction.
 *
 * `resetTime` is optional in the library's own types — the in-memory store
 * always sets it, a Redis store need not — so the window length stands in when
 * it is missing. Exported because that rule deserves a test of its own; the
 * branch cannot be reached through an HTTP request.
 */
export function retryAfterSeconds(resetTime: Date | undefined, windowMs: number): number {
  if (!resetTime) return Math.ceil(windowMs / 1000);

  const remainingMs = resetTime.getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 1000));
}
