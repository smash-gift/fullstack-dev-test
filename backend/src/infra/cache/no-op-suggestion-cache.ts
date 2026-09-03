import type { Suggestion } from '../../domain/entities/suggestion.js';
import type { SuggestionCache } from '../../domain/repositories/suggestion-cache.js';

/**
 * Cache that stores nothing.
 *
 * Used when CACHE_ENABLED is false, and in tests that need every request to
 * reach the provider. The real LRU implementation arrives in phase 07.
 */
export class NoOpSuggestionCache implements SuggestionCache {
  async get(): Promise<readonly Suggestion[] | null> {
    return null;
  }

  async set(): Promise<void> {
    // Intentionally does nothing.
  }
}
