import { DomainError } from './domain-error.js';

/**
 * The caller exceeded the request budget for its window.
 *
 * Deliberately **not** a degradation. A fallback here would serve suggestions
 * to whoever just blew through the limit, teaching the client that insisting
 * works and undoing the only control that caps this endpoint's cost. `429` is
 * a signal to slow down, so it stays a signal.
 */
export class RateLimitedError extends DomainError {
  readonly code = 'RATE_LIMITED';

  /** Seconds until the current window resets. Mirrored in `Retry-After`. */
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('Too many requests. Please try again later.');
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
