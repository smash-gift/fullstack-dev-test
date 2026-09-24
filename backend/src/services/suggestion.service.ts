import type { FastifyBaseLogger } from 'fastify';
import { TtlCache, cacheKey } from '../lib/cache.js';
import { FallbackProvider } from '../providers/fallback.provider.js';
import type {
  LlmProvider,
  SuggestionRequest,
  SuggestionResponse,
} from '../types.js';

interface SuggestionServiceDeps {
  /** Primary provider (Gemini). Omit to run in fallback-only mode. */
  llm?: LlmProvider | undefined;
  /** Deterministic fallback. Defaults to the built-in curated provider. */
  fallback?: LlmProvider;
  /** Cache TTL in ms. 0 disables caching. */
  cacheTtlMs?: number;
}

/**
 * Core business logic:
 *   1. Serve from cache when possible (LLM results only).
 *   2. Try the LLM; on any typed failure, fall back gracefully.
 *   3. Never throw for LLM failures — the caller always gets suggestions.
 *
 * The route layer stays thin; all resilience lives here.
 */
export class SuggestionService {
  private readonly llm: LlmProvider | undefined;
  private readonly fallback: LlmProvider;
  private readonly cache: TtlCache<string[]>;

  constructor(deps: SuggestionServiceDeps = {}) {
    this.llm = deps.llm;
    this.fallback = deps.fallback ?? new FallbackProvider();
    this.cache = new TtlCache<string[]>(deps.cacheTtlMs ?? 0);
  }

  async getSuggestions(
    input: SuggestionRequest,
    logger?: FastifyBaseLogger,
  ): Promise<SuggestionResponse> {
    const key = cacheKey(input);

    const cached = this.cache.get(key);
    if (cached) {
      logger?.debug({ key }, 'suggestions cache hit');
      return { suggestions: cached, source: 'llm' };
    }

    if (this.llm) {
      try {
        const suggestions = await this.llm.generateSuggestions(input);
        this.cache.set(key, suggestions);
        return { suggestions, source: 'llm' };
      } catch (err) {
        // Log the real cause server-side (never sent to the client) and fall
        // back to a safe, deterministic response.
        logger?.warn(
          { err, provider: this.llm.name },
          'LLM call failed, serving fallback',
        );
      }
    } else {
      logger?.debug('LLM disabled (no API key), serving fallback');
    }

    const suggestions = await this.fallback.generateSuggestions(input);
    return { suggestions, source: 'fallback' };
  }
}
