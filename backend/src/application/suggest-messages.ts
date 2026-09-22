import { UpstreamFailure } from '../domain/errors.js';
import type {
  CallBudget,
  FallbackCatalog,
  LlmProvider,
  Logger,
  SuggestionPoolCache,
} from '../domain/ports.js';
import type {
  DegradedReason,
  Suggestion,
  SuggestionRequest,
  SuggestionResult,
} from '../domain/suggestion.js';
import { cacheKeyFor } from './cache-key.js';

export interface SuggestMessagesDeps {
  provider: LlmProvider;
  fallback: FallbackCatalog;
  cache: SuggestionPoolCache | null;
  budget: CallBudget;
  logger: Logger;
  timeoutMs: number;
}

function sample(pool: Suggestion[], count: number): Suggestion[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, count).map((item, index) => ({ id: `s${index + 1}`, text: item.text }));
}

/**
 * The one rule this use case enforces: a caller that sent a valid request
 * always gets usable messages. Every LLM problem degrades into the curated
 * catalog, tagged with the reason, and never surfaces as an error.
 */
export class SuggestMessages {
  constructor(private readonly deps: SuggestMessagesDeps) {}

  async execute(request: SuggestionRequest, requestId: string): Promise<SuggestionResult> {
    const startedAt = Date.now();
    const { provider, cache, budget, fallback, logger, timeoutMs } = this.deps;
    const key = cacheKeyFor(request, provider.model, provider.promptVersion);

    if (cache && !request.refresh) {
      const pool = cache.read(key);
      if (pool && pool.length >= request.count) {
        return {
          suggestions: sample(pool, request.count),
          source: 'cache',
          model: provider.model,
          promptVersion: provider.promptVersion,
          latencyMs: Date.now() - startedAt,
        };
      }
    }

    if (!provider.isConfigured) {
      return this.degrade(request, 'not_configured', startedAt, requestId);
    }

    if (!budget.tryConsume()) {
      return this.degrade(request, 'budget_exhausted', startedAt, requestId);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const generated = await provider.generate(request, controller.signal);
      cache?.merge(key, generated.suggestions);
      logger.info(
        { requestId, source: 'llm', model: generated.model, latencyMs: Date.now() - startedAt },
        'suggestions generated',
      );
      return {
        suggestions: generated.suggestions,
        source: 'llm',
        model: generated.model,
        promptVersion: generated.promptVersion,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      const reason = error instanceof UpstreamFailure ? error.reason : 'upstream_error';
      logger.warn(
        { requestId, reason, message: error instanceof Error ? error.message : 'unknown' },
        'llm path failed, serving fallback',
      );
      return this.degrade(request, reason, startedAt, requestId);
    } finally {
      clearTimeout(timer);
    }
  }

  private degrade(
    request: SuggestionRequest,
    reason: DegradedReason,
    startedAt: number,
    requestId: string,
  ): SuggestionResult {
    const suggestions = this.deps.fallback.messagesFor(request);
    this.deps.logger.info(
      { requestId, source: 'fallback', reason },
      'serving fallback suggestions',
    );
    return {
      suggestions,
      source: 'fallback',
      degradedReason: reason,
      latencyMs: Date.now() - startedAt,
    };
  }
}
