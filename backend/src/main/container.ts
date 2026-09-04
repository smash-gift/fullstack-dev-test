import type { SuggestionCache } from '../domain/repositories/suggestion-cache.js';
import type { LlmProvider } from '../domain/providers/llm-provider.js';
import { SuggestMessagesUseCase } from '../domain/usecases/suggest-messages.usecase.js';
import { InMemorySuggestionCache } from '../infra/cache/in-memory-suggestion-cache.js';
import { NoOpSuggestionCache } from '../infra/cache/no-op-suggestion-cache.js';
import { StaticFallbackCatalog } from '../infra/fallback/static-fallback-catalog.js';
import { createLlmProvider } from '../infra/llm/llm-provider.factory.js';
import { RetryingLlmProvider } from '../infra/llm/resilience/retrying-llm.provider.js';
import { LlmOutputGuard } from '../infra/llm/security/output-guard.js';
import type { Env } from '../pkg/config/env.js';
import { createLogger, type Logger } from '../pkg/logger/logger.js';
import { SuggestionsController } from '../presentation/controllers/suggestions.controller.js';

export interface Container {
  readonly env: Env;
  readonly logger: Logger;
  readonly llmProvider: LlmProvider;
  readonly suggestionCache: SuggestionCache;
  readonly suggestionsController: SuggestionsController;
}

export interface ContainerOverrides {
  readonly logger?: Logger;
  readonly llmProvider?: LlmProvider;
  readonly suggestionCache?: SuggestionCache;
}

/**
 * The only place allowed to instantiate adapters.
 *
 * Keeping construction in one file is what makes the dependency graph
 * auditable: if something is talking to the outside world, it was wired here.
 *
 * Overrides exist so tests can replace a provider or cache without touching
 * environment variables.
 */
export function buildContainer(env: Env, overrides: ContainerOverrides = {}): Container {
  const logger =
    overrides.logger ??
    createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === 'development' });
  const baseProvider = overrides.llmProvider ?? createLlmProvider(env);
  const llmProvider =
    env.LLM_MAX_RETRIES > 0
      ? new RetryingLlmProvider(baseProvider, {
          maxRetries: env.LLM_MAX_RETRIES,
          baseDelayMs: env.LLM_RETRY_BASE_DELAY_MS,
          logger,
        })
      : baseProvider;
  const suggestionCache = overrides.suggestionCache ?? createSuggestionCache(env);

  const useCase = new SuggestMessagesUseCase({
    provider: llmProvider,
    cache: suggestionCache,
    fallback: new StaticFallbackCatalog(),
    guard: new LlmOutputGuard(),
    logger,
    options: { llmTimeoutMs: env.LLM_TIMEOUT_MS, cacheTtlMs: env.CACHE_TTL_MS },
  });

  return {
    env,
    logger,
    llmProvider,
    suggestionCache,
    suggestionsController: new SuggestionsController(useCase),
  };
}

function createSuggestionCache(env: Env): SuggestionCache {
  if (!env.CACHE_ENABLED) return new NoOpSuggestionCache();
  return new InMemorySuggestionCache({ maxEntries: env.CACHE_MAX_ENTRIES });
}
