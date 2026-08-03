import { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';

/**
 * Dependency-free fixed-window rate limiter keyed by client IP.
 *
 * When the limit is exceeded we respond 429 with a safe JSON message and a
 * `Retry-After` header. This protects the (paid) LLM from bursts/abuse. It is
 * per-instance in-memory — fine for the test; production would use a shared
 * store. Thresholds are configurable via RATE_LIMIT_* env vars.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const { max, windowMs } = config.rateLimit;
  const key = req.ip ?? 'unknown';
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: 'rate_limited',
      message: 'Too many requests. Please try again shortly.',
    });
    return;
  }

  next();
}

/** Test helper to reset limiter state between cases. */
export function resetRateLimit(): void {
  buckets.clear();
}
