import type { Suggestion } from '../../domain/entities/suggestion.js';
import type { SuggestionCache } from '../../domain/repositories/suggestion-cache.js';

interface CacheEntry {
  readonly suggestions: readonly Suggestion[];
  readonly expiresAt: number;
}

export interface InMemorySuggestionCacheOptions {
  readonly maxEntries: number;
  /** Injectable so tests can advance time without waiting. */
  readonly now?: () => number;
}

/**
 * LRU cache with per-entry TTL, held in the process.
 *
 * Known limitation, accepted for this scope: it is not shared across
 * instances and is lost on restart. Swapping in Redis or Firestore means
 * adding one file that implements `SuggestionCache` — the use case does not
 * change, which is why the port is async.
 *
 * See docs/01-architecture/decisions/adr-0006-caching-and-cost.md
 */
export class InMemorySuggestionCache implements SuggestionCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: InMemorySuggestionCacheOptions) {
    this.maxEntries = options.maxEntries;
    this.now = options.now ?? Date.now;
  }

  async get(key: string): Promise<readonly Suggestion[] | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return null;
    }

    // Re-insert to mark as most recently used: Map preserves insertion order.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.suggestions;
  }

  async set(key: string, suggestions: readonly Suggestion[], ttlMs: number): Promise<void> {
    this.entries.delete(key);
    this.entries.set(key, { suggestions, expiresAt: this.now() + ttlMs });

    // Insertion order is eviction order, so walking the keys is walking from
    // oldest to newest. The earlier version asked the iterator whether it was
    // done, which the loop condition already guarantees it is not - a branch
    // no test could take, on a `Map` that cannot be empty here.
    for (const key of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries) break;
      this.entries.delete(key);
    }
  }

  get size(): number {
    return this.entries.size;
  }
}
