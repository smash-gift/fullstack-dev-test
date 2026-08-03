export type SuggestionSource = 'llm' | 'cache' | 'fallback';

export interface SuggestionRequest {
  occasion: string;
  relationship: string;
}

export interface SuggestionResponse {
  suggestions: string[];
  source: SuggestionSource;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
