export type SuggestionSource = 'llm' | 'fallback';

export type SuggestionInput = {
  occasion: string;
  relationship: string;
};

export type SuggestionResponse = {
  suggestions: string[];
  source: SuggestionSource;
  fallback: boolean;
};

export interface LlmClient {
  generateSuggestions(input: SuggestionInput): Promise<string[]>;
}

export interface SuggestionService {
  suggest(input: SuggestionInput): Promise<SuggestionResponse>;
}
