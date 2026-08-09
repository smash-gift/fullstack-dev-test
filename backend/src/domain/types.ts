/** Where the suggestions in a response came from. Sent to the client so the UI can react. */
export type Source = 'llm' | 'cache' | 'fallback';

export interface SuggestionRequest {
  occasion: string;
  relationship: string;
}

export interface SuggestionResult {
  suggestions: string[];
  source: Source;
}

/**
 * Generates suggestions from a language model. Implementations throw on any
 * transport or protocol failure; the service treats every throw the same way.
 */
export interface LlmClient {
  generate(input: SuggestionRequest): Promise<string[]>;
}

/**
 * Stores previously generated suggestions. Both methods are best-effort: the
 * service never lets a cache failure turn into a failed request.
 */
export interface CacheStore {
  get(key: string): Promise<string[] | null>;
  set(key: string, suggestions: string[], input: SuggestionRequest): Promise<void>;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string): Promise<RateLimitDecision>;
}

/** Keeps the domain free of any logging framework. */
export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
