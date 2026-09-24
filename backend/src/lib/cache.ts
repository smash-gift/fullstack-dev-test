/**
 * Minimal in-memory LRU cache with per-entry TTL. Intentionally dependency-free
 * and process-local: it is enough to cut cost/latency for popular
 * occasion+relationship combinations in this test. In production this would be
 * a shared store (e.g. Redis) so instances share the cache — see README.
 */
export class TtlCache<V> {
  private readonly store = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: string): V | undefined {
    if (this.ttlMs <= 0) return undefined;
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency (LRU): re-insert to move to the end.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.ttlMs <= 0) return;

    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** Stable cache key for a suggestion request. */
export function cacheKey(parts: {
  occasion: string;
  relationship: string;
}): string {
  return [
    parts.occasion.toLowerCase(),
    parts.relationship.toLowerCase(),
  ].join('|');
}
