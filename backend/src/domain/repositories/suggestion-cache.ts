import type { Suggestion } from '../entities/suggestion.js';

/**
 * Cache of previously generated suggestions.
 *
 * Deliberately asynchronous even though the in-memory implementation is not:
 * a synchronous signature would force every caller to change when this is
 * swapped for Redis or Firestore. Async from the start makes that swap a new
 * file and nothing else.
 *
 * See docs/01-architecture/decisions/adr-0006-caching-and-cost.md
 */
export interface SuggestionCache {
  get(key: string): Promise<readonly Suggestion[] | null>;
  set(key: string, suggestions: readonly Suggestion[], ttlMs: number): Promise<void>;
}
