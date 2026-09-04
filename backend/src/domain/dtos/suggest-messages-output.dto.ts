import type { Suggestion } from '../entities/suggestion.js';

export type SuggestionSource = 'llm' | 'fallback';

/**
 * Why a response was degraded. These are stable codes, safe for clients to
 * switch on — unlike error messages, which may be reworded.
 */
export type DegradationReason =
  | 'llm_timeout'
  | 'llm_rate_limited'
  | 'llm_unavailable'
  | 'llm_invalid_response'
  | 'llm_auth_error';

export interface SuggestMessagesOutput {
  readonly suggestions: readonly Suggestion[];
  readonly source: SuggestionSource;
  /** Null when the suggestions did not come from a model. */
  readonly model: string | null;
  readonly degraded: boolean;
  readonly cached: boolean;
  /** Present only when `degraded` is true. */
  readonly reason?: DegradationReason;
}
