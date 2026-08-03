/** Shared domain types for the suggestion feature. */

export interface SuggestionRequest {
  occasion: string;
  relationship: string;
  /** Optional free-form tone hint, e.g. "funny", "heartfelt". */
  tone?: string;
}

/** Where a set of suggestions came from — surfaced to the client for clarity. */
export type SuggestionSource = 'llm' | 'fallback' | 'cache';

export interface SuggestionResponse {
  suggestions: string[];
  source: SuggestionSource;
  /**
   * True when the LLM was expected to run but failed and we served the static
   * fallback instead. Lets the client optionally hint "showing generic ideas".
   */
  degraded: boolean;
}
