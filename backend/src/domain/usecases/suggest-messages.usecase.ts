import type { SuggestMessagesInput } from '../dtos/suggest-messages-input.dto.js';
import type { SuggestMessagesOutput } from '../dtos/suggest-messages-output.dto.js';
import type { LlmProvider } from '../providers/llm-provider.js';
import type { SuggestionCache } from '../repositories/suggestion-cache.js';
import { buildSuggestionCacheKey } from '../services/suggestion-cache-key.js';

export interface SuggestMessagesUseCaseOptions {
  readonly llmTimeoutMs: number;
  readonly cacheTtlMs: number;
}

/**
 * Turns a validated request into gift card message suggestions.
 *
 * Depends only on ports, so it has no idea which provider is configured, nor
 * whether the cache lives in memory or in Redis. That is what makes the
 * failure paths testable without network access.
 *
 * The degradation branch (falling back to a curated catalogue when the model
 * fails) is added in phase 04 — see docs/02-phases/phase-04-failure-handling.md
 */
export class SuggestMessagesUseCase {
  constructor(
    private readonly provider: LlmProvider,
    private readonly cache: SuggestionCache,
    private readonly options: SuggestMessagesUseCaseOptions,
  ) {}

  async execute(input: SuggestMessagesInput): Promise<SuggestMessagesOutput> {
    const cacheKey = buildSuggestionCacheKey(this.provider.name, this.provider.model, input);

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return {
        suggestions: cached,
        source: 'llm',
        model: this.provider.model,
        degraded: false,
        cached: true,
      };
    }

    const suggestions = await this.callProvider(input);
    await this.cache.set(cacheKey, suggestions, this.options.cacheTtlMs);

    return {
      suggestions,
      source: 'llm',
      model: this.provider.model,
      degraded: false,
      cached: false,
    };
  }

  /**
   * The timeout is owned here rather than inside each adapter, so no adapter
   * can quietly opt out of it.
   */
  private async callProvider(input: SuggestMessagesInput) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.llmTimeoutMs);

    try {
      return await this.provider.generateSuggestions(input, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }
}
