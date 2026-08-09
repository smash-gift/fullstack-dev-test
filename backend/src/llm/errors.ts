/**
 * Failures the LLM call can produce.
 *
 * `retryable` is the only thing the caller needs to decide what to do next, so
 * it lives on the error rather than in a switch somewhere else. Every one of
 * these ends the same way for the user — the curated fallback — but only some
 * are worth a second attempt.
 */
export abstract class LlmError extends Error {
  abstract readonly retryable: boolean;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The request did not finish inside the configured budget. */
export class LlmTimeoutError extends LlmError {
  readonly retryable = true;
}

/** HTTP 429. Worth one more try; the provider may just be pacing us. */
export class LlmRateLimitError extends LlmError {
  readonly retryable = true;
}

/** HTTP 5xx. Transient on the provider's side. */
export class LlmServerError extends LlmError {
  readonly retryable = true;
}

/** DNS, connection reset, TLS. Transient on ours. */
export class LlmNetworkError extends LlmError {
  readonly retryable = true;
}

/**
 * HTTP 401/403/400 — a missing key, a revoked key, a model the account cannot
 * use. Deterministic, so retrying only burns another timeout budget.
 */
export class LlmConfigurationError extends LlmError {
  readonly retryable = false;
}

/** The call succeeded but the body was not what the contract requires. */
export class LlmInvalidResponseError extends LlmError {
  readonly retryable = false;
}

/**
 * The answer was well-formed but not fit to print on a gift card.
 *
 * Not retryable: the same input steered the model once and would steer it
 * again. The curated fallback is the right answer here.
 */
export class LlmUnsafeContentError extends LlmError {
  readonly retryable = false;
}

/** Raised by the client used when FORCE_LLM_FAILURE is on. */
export class LlmForcedFailureError extends LlmError {
  readonly retryable = false;
}
