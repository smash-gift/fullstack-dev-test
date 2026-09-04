import type { DegradationReason } from '../dtos/suggest-messages-output.dto.js';
import { DomainError } from './domain-error.js';

/**
 * Something went wrong while obtaining suggestions from the model.
 *
 * Every subclass degrades: none of them reaches the client as an HTTP error.
 * The use case catches these, logs them, and serves the fallback catalogue.
 * See docs/01-architecture/decisions/adr-0003-fallback-strategy.md
 */
export abstract class LlmError extends DomainError {
  abstract readonly degradationReason: DegradationReason;
}

/** The provider did not answer within the time budget. */
export class LlmTimeoutError extends LlmError {
  readonly code = 'LLM_TIMEOUT';
  readonly degradationReason = 'llm_timeout' as const;

  constructor(timeoutMs?: number) {
    super(
      timeoutMs === undefined
        ? 'LLM request was aborted after exceeding its time budget'
        : `LLM request timed out after ${timeoutMs}ms`,
    );
  }
}

/** The provider rejected the call because our quota is exhausted (HTTP 429). */
export class LlmRateLimitError extends LlmError {
  readonly code = 'LLM_RATE_LIMITED';
  readonly degradationReason = 'llm_rate_limited' as const;

  constructor(message = 'LLM provider rate limit reached') {
    super(message);
  }
}

/** The provider is down, unreachable, or returned 5xx. */
export class LlmUnavailableError extends LlmError {
  readonly code = 'LLM_UNAVAILABLE';
  readonly degradationReason = 'llm_unavailable' as const;

  constructor(message = 'LLM provider is unavailable') {
    super(message);
  }
}

/**
 * The provider answered, but not with something usable.
 *
 * Malformed JSON, a payload failing the schema, the wrong number of
 * suggestions, or output rejected by the security guard all land here: the
 * model replied, it just did not reply with anything we can serve.
 */
export class LlmInvalidResponseError extends LlmError {
  readonly code = 'LLM_INVALID_RESPONSE';
  readonly degradationReason = 'llm_invalid_response' as const;

  constructor(message = 'LLM returned an unusable response') {
    super(message);
  }
}

/** Missing or rejected credentials. A configuration problem, not a transient one. */
export class LlmAuthError extends LlmError {
  readonly code = 'LLM_AUTH_ERROR';
  readonly degradationReason = 'llm_auth_error' as const;

  constructor(message = 'LLM provider rejected the credentials') {
    super(message);
  }
}

/**
 * The model answered, and the security guard refused to serve what it said.
 *
 * Extends LlmInvalidResponseError rather than standing beside it, so the code
 * and the degradation reason reaching the client are IDENTICAL to those of a
 * model that simply returned malformed JSON. An attacker probing the endpoint
 * cannot tell a blocked payload from an ordinary bad completion, which makes
 * trial-and-error considerably more expensive.
 *
 * `violation` is a stable code, never the offending text: a log is not a sink
 * for attacker-controlled input.
 */
export class LlmOutputBlockedError extends LlmInvalidResponseError {
  readonly violation: string;

  /**
   * True only for a confirmed system-prompt disclosure (the canary). That is
   * the one case here that deserves a human looking at it, rather than a
   * counter going up.
   */
  readonly severe: boolean;

  /**
   * True when the model broke a rule of style rather than a rule of safety.
   *
   * The distinction is worth a field because the answers differ. A message
   * that leaks the canary or carries a URL must never be served, and asking
   * the model again is throwing money at an attacker. A message that runs to
   * three sentences is safe, on topic and useful - it simply misses the shape
   * we promised, and one more attempt usually lands it. Only the caller knows
   * whether it can afford that attempt, so the guard states the fact and the
   * use case decides.
   */
  readonly recoverable: boolean;

  constructor(violation: string, options: { severe?: boolean; recoverable?: boolean } = {}) {
    super(`LLM output blocked by the security guard: ${violation}`);
    this.violation = violation;
    this.severe = options.severe ?? false;
    this.recoverable = options.recoverable ?? false;
  }
}
