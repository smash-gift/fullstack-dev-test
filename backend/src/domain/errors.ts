import type { DegradedReason } from './suggestion.js';

/**
 * Anything that makes the LLM path unusable for this request. It never reaches
 * the client: the use case catches it and answers with the fallback catalog,
 * carrying only `reason` outwards.
 */
export class UpstreamFailure extends Error {
  constructor(
    readonly reason: DegradedReason,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'UpstreamFailure';
  }
}

/** A problem with what the caller sent. This one does reach the client, as 400. */
export class InvalidRequestError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'InvalidRequestError';
  }
}

export class RateLimitedError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Too many requests');
    this.name = 'RateLimitedError';
  }
}
