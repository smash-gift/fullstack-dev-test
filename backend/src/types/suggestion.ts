export type SuggestionSource = 'llm' | 'fallback';

export interface SuggestionResponse {
  suggestions: string[];
  source: SuggestionSource;
}