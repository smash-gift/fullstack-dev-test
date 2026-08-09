import { cacheKey } from './cacheKey';
import type {
  CacheStore,
  LlmClient,
  Logger,
  SuggestionRequest,
  SuggestionResult,
} from './types';
import type { FallbackProvider } from '../fallback/fallbackProvider';

export const SUGGESTION_COUNT = 3;
const MIN_SUGGESTIONS = 2;
const MAX_SUGGESTIONS = 3;
const MAX_MESSAGE_LENGTH = 200;

export interface SuggestionServiceDeps {
  llm: LlmClient;
  cache: CacheStore;
  fallback: FallbackProvider;
  logger: Logger;
}

/**
 * Decides which suggestions a request gets: cache, then the model, then the
 * curated fallback.
 *
 * Knows nothing about HTTP, Firebase, or OpenAI — it only talks to the ports in
 * `types.ts`. That is what lets the whole decision tree be tested with plain
 * doubles, no emulator and no API key.
 */
export class SuggestionService {
  constructor(private readonly deps: SuggestionServiceDeps) {}

  async suggest(input: SuggestionRequest): Promise<SuggestionResult> {
    const key = cacheKey(input);

    const cached = await this.readCache(key);
    if (cached) {
      return { suggestions: cached, source: 'cache' };
    }

    try {
      const generated = await this.deps.llm.generate(input);
      const cleaned = generated.map((message) => message.trim());

      if (!isUsable(cleaned)) {
        throw new Error(`Model returned ${cleaned.length} unusable suggestion(s)`);
      }

      await this.writeCache(key, cleaned, input);
      return { suggestions: cleaned, source: 'llm' };
    } catch (error) {
      // Every model failure lands here — timeout, 429, 5xx, malformed output.
      // The caller still gets usable content, so this is a warning, not an error.
      this.deps.logger.warn('llm_generation_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });

      // Deliberately not cached: a momentary outage must not become a day of
      // generic answers for this occasion and relationship.
      return {
        suggestions: this.deps.fallback.pick(SUGGESTION_COUNT),
        source: 'fallback',
      };
    }
  }

  private async readCache(key: string): Promise<string[] | null> {
    try {
      const cached = await this.deps.cache.get(key);
      return cached && isUsable(cached) ? cached : null;
    } catch (error) {
      // A cache outage degrades cost, never availability.
      this.deps.logger.warn('cache_read_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  }

  private async writeCache(
    key: string,
    suggestions: string[],
    input: SuggestionRequest,
  ): Promise<void> {
    try {
      await this.deps.cache.set(key, suggestions, input);
    } catch (error) {
      this.deps.logger.warn('cache_write_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}

/**
 * Guards the contract the client depends on, whatever the model or the cache
 * returns. Takes `unknown` on purpose: a Firestore document types as `string[]`
 * but is really whatever was written to it.
 */
function isUsable(suggestions: unknown): boolean {
  if (!Array.isArray(suggestions)) {
    return false;
  }

  if (suggestions.length < MIN_SUGGESTIONS || suggestions.length > MAX_SUGGESTIONS) {
    return false;
  }

  return suggestions.every(
    (message) =>
      typeof message === 'string' &&
      message.trim().length > 0 &&
      message.length <= MAX_MESSAGE_LENGTH,
  );
}
