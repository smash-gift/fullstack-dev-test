import { InMemorySuggestionCache } from '../cache/memoryCache';
import { SuggestionCache } from '../cache/suggestionCache';
import { config, isLlmConfigured } from '../config/env';
import { fallbackSuggestions } from '../fallback/fallbackSuggestions';
import { LlmProvider } from '../llm/llm.provider';
import { SuggestionRequest, SuggestionResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * Orchestrates a suggestion request. This is where the resilience policy lives:
 *
 *   1. Serve from cache if we have an identical recent request.
 *   2. If no LLM is configured, return the static fallback (not "degraded" —
 *      it's the expected mode without a key).
 *   3. Otherwise call the LLM. On ANY failure, log server-side and return the
 *      fallback marked `degraded: true`. We never throw the raw error up to the
 *      HTTP layer for this endpoint — the user always gets usable suggestions.
 */
export class SuggestionService {
  private readonly cache: SuggestionCache;

  constructor(
    private readonly llm: LlmProvider,
    cache: SuggestionCache = new InMemorySuggestionCache(config.cache.ttlMs),
  ) {
    this.cache = cache;
  }

  async getSuggestions(input: SuggestionRequest): Promise<SuggestionResponse> {
    const key = this.cacheKey(input);

    const cached = await this.cache.get(key);
    if (cached) {
      return { suggestions: cached, source: 'cache', degraded: false };
    }

    if (!isLlmConfigured()) {
      // Expected offline mode: no key set. Deterministic, not an error.
      return { suggestions: fallbackSuggestions(input), source: 'fallback', degraded: false };
    }

    try {
      const suggestions = await this.llm.generateSuggestions(input);
      await this.cache.set(key, suggestions);
      return { suggestions, source: 'llm', degraded: false };
    } catch (err) {
      // The crux of the exercise: absorb the failure, keep details server-side.
      logger.error('LLM generation failed; serving fallback', {
        provider: this.llm.name,
        kind: (err as { kind?: string })?.kind ?? 'unknown',
        message: (err as Error)?.message,
      });
      return { suggestions: fallbackSuggestions(input), source: 'fallback', degraded: true };
    }
  }

  private cacheKey(input: SuggestionRequest): string {
    return [input.occasion, input.relationship, input.tone ?? '']
      .map((s) => s.trim().toLowerCase())
      .join('|');
  }
}
