import type { Suggestion } from '../domain/suggestion.js';
import type { SuggestionPoolCache } from '../domain/ports.js';

interface Entry {
  suggestions: Suggestion[];
  expiresAt: number;
}

export interface PoolCacheOptions {
  ttlMs: number;
  maxEntries: number;
  maxPoolSize?: number;
}

/**
 * Caching a single response per key would make every user of the same
 * occasion/relationship pair see the exact same three messages, which is a poor
 * experience for a gift card. So each key keeps a pool of messages that grows
 * as the model is called again, and reads sample from it. In-process on
 * purpose: see the caching section of the README for what production would use.
 */
export class InMemorySuggestionPoolCache implements SuggestionPoolCache {
  private readonly entries = new Map<string, Entry>();
  private readonly maxPoolSize: number;

  constructor(private readonly options: PoolCacheOptions) {
    this.maxPoolSize = options.maxPoolSize ?? 12;
  }

  read(key: string): Suggestion[] | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.suggestions;
  }

  merge(key: string, suggestions: Suggestion[]): void {
    const existing = this.read(key) ?? [];
    const seen = new Set(existing.map((item) => item.text.toLowerCase()));
    const merged = [...existing];

    for (const suggestion of suggestions) {
      if (seen.has(suggestion.text.toLowerCase())) continue;
      seen.add(suggestion.text.toLowerCase());
      merged.push(suggestion);
    }

    this.entries.set(key, {
      suggestions: merged.slice(-this.maxPoolSize),
      expiresAt: Date.now() + this.options.ttlMs,
    });

    if (this.entries.size > this.options.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }
}
