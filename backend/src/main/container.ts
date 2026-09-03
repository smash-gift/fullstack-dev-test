import type { SuggestionCache } from '../domain/repositories/suggestion-cache.js';
import type { LlmProvider } from '../domain/providers/llm-provider.js';
import { SuggestMessagesUseCase } from '../domain/usecases/suggest-messages.usecase.js';
import { InMemorySuggestionCache } from '../infra/cache/in-memory-suggestion-cache.js';
import { NoOpSuggestionCache } from '../infra/cache/no-op-suggestion-cache.js';
import { StubLlmProvider } from '../infra/llm/stub/stub-llm.provider.js';
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
  const logger = overrides.logger ?? createLogger(env);
  const llmProvider = overrides.llmProvider ?? createLlmProvider(env);
  const suggestionCache = overrides.suggestionCache ?? createSuggestionCache(env);

  const useCase = new SuggestMessagesUseCase(llmProvider, suggestionCache, {
    llmTimeoutMs: env.LLM_TIMEOUT_MS,
    cacheTtlMs: env.CACHE_TTL_MS,
  });

  return {
    env,
    logger,
    llmProvider,
    suggestionCache,
    suggestionsController: new SuggestionsController(useCase),
  };
}

function createLlmProvider(env: Env): LlmProvider {
  switch (env.LLM_PROVIDER) {
    case 'stub':
      return new StubLlmProvider();
    // openai, openrouter and gemini adapters arrive in phase 03.
    default:
      throw new Error(
        `LLM_PROVIDER="${env.LLM_PROVIDER}" is not implemented yet. Use "stub" until phase 03.`,
      );
  }
}

function createSuggestionCache(env: Env): SuggestionCache {
  if (!env.CACHE_ENABLED) return new NoOpSuggestionCache();
  return new InMemorySuggestionCache({ maxEntries: env.CACHE_MAX_ENTRIES });
}
