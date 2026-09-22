import type { Suggestion, SuggestionRequest } from './suggestion.js';

export interface GeneratedSuggestions {
  suggestions: Suggestion[];
  model: string;
  promptVersion: string;
}

/**
 * The seam that makes the fallback path testable: the use case only ever sees
 * this interface, so a stub provider can fail on demand without any network.
 */
export interface LlmProvider {
  readonly isConfigured: boolean;
  readonly model: string;
  readonly promptVersion: string;
  generate(request: SuggestionRequest, signal: AbortSignal): Promise<GeneratedSuggestions>;
}

export interface FallbackCatalog {
  messagesFor(request: SuggestionRequest): Suggestion[];
}

export interface SuggestionPoolCache {
  read(key: string): Suggestion[] | undefined;
  merge(key: string, suggestions: Suggestion[]): void;
}

export interface CallBudget {
  tryConsume(): boolean;
}

export interface Logger {
  info(payload: Record<string, unknown>, message: string): void;
  warn(payload: Record<string, unknown>, message: string): void;
  error(payload: Record<string, unknown>, message: string): void;
}
