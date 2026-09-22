export type Locale = 'en' | 'pt-BR';

export type SuggestionSource = 'llm' | 'cache' | 'fallback';

/**
 * Why the response could not be served by the LLM. Present only when
 * `source === 'fallback'`; it is what the client renders the degraded notice
 * from, and what we aggregate on to tell a provider outage apart from a
 * misconfigured deploy.
 */
export type DegradedReason =
  | 'not_configured'
  | 'timeout'
  | 'rate_limited'
  | 'upstream_error'
  | 'invalid_output'
  | 'unsafe_output'
  | 'budget_exhausted';

export interface SuggestionRequest {
  occasion: string;
  relationship: string;
  locale: Locale;
  count: number;
  refresh: boolean;
}

export interface Suggestion {
  id: string;
  text: string;
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  source: SuggestionSource;
  degradedReason?: DegradedReason;
  model?: string;
  promptVersion?: string;
  latencyMs: number;
}
