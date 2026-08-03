import { SuggestionRequest } from '../types';

/**
 * Provider-agnostic contract for generating gift-card message suggestions.
 *
 * Keeping this interface small and free of any vendor types is what allows the
 * OpenAI implementation to be swapped for Gemini (or a mock in tests) without
 * touching the service, controller, or routes.
 */
export interface LlmProvider {
  readonly name: string;
  /**
   * Returns 2–3 short suggestions. Implementations should throw an
   * `LlmError` on any failure (timeout, rate limit, upstream 5xx, malformed
   * output); the service layer is responsible for the fallback.
   */
  generateSuggestions(input: SuggestionRequest): Promise<string[]>;
}

export type LlmErrorKind = 'timeout' | 'rate_limited' | 'upstream' | 'invalid_output' | 'unknown';

/** Normalized error so the service can reason about failures provider-agnostically. */
export class LlmError extends Error {
  constructor(
    public readonly kind: LlmErrorKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}
