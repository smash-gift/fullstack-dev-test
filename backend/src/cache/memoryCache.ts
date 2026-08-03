import { TtlCache } from '../utils/cache';
import { SuggestionCache } from './suggestionCache';

/**
 * Default cache: the in-memory TTL cache wrapped in the async
 * {@link SuggestionCache} interface. Used by the standalone server and in tests
 * — no external dependency.
 */
export class InMemorySuggestionCache implements SuggestionCache {
  private readonly cache: TtlCache<string[]>;

  constructor(ttlMs: number) {
    this.cache = new TtlCache<string[]>(ttlMs);
  }

  async get(key: string): Promise<string[] | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: string[]): Promise<void> {
    this.cache.set(key, value);
  }
}
