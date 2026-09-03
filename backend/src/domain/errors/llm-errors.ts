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
