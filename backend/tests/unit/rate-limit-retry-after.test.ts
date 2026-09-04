import { describe, expect, it } from 'vitest';

import {
  rateLimitedError,
  retryAfterSeconds,
} from '../../src/presentation/middlewares/rate-limit.middleware.js';

const WINDOW_MS = 300_000;

describe('Retry-After', () => {
  it('reports the seconds left in the window', () => {
    const resetTime = new Date(Date.now() + 143_000);

    expect(retryAfterSeconds(resetTime, WINDOW_MS)).toBe(143);
  });

  it('rounds up, so it never points at a moment still inside the window', () => {
    const resetTime = new Date(Date.now() + 10_400);

    expect(retryAfterSeconds(resetTime, WINDOW_MS)).toBe(11);
  });

  /** `Retry-After: 0` reads as "retry immediately", the opposite instruction. */
  it('never says zero', () => {
    expect(retryAfterSeconds(new Date(Date.now() - 5_000), WINDOW_MS)).toBe(1);
    expect(retryAfterSeconds(new Date(Date.now()), WINDOW_MS)).toBe(1);
  });

  /**
   * The in-memory store always reports a reset time; a Redis store need not,
   * and the library's types say so. The window length is the honest answer
   * then — never no answer at all.
   */
  it('falls back to the window length when the store reports no reset time', () => {
    expect(retryAfterSeconds(undefined, WINDOW_MS)).toBe(300);
  });

  // The handler's own line, reachable only from here: a store that reports no
  // reset time still has to produce a `Retry-After` the client can act on.
  it('builds the error even when the store reports no reset time', () => {
    const error = rateLimitedError(undefined, 300_000);

    expect(error.retryAfterSeconds).toBe(300);
  });

  it('uses the reset time the store reports, when it reports one', () => {
    const error = rateLimitedError(
      { limit: 30, used: 31, remaining: 0, resetTime: new Date(Date.now() + 42_000), key: 'ip' },
      300_000,
    );

    expect(error.retryAfterSeconds).toBeGreaterThan(40);
    expect(error.retryAfterSeconds).toBeLessThanOrEqual(42);
  });
});
