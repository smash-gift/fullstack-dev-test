import type { SuggestMessagesInput } from '../dtos/suggest-messages-input.dto.js';
import type { SuggestMessagesOutput } from '../dtos/suggest-messages-output.dto.js';
import { LlmError, LlmOutputBlockedError } from '../errors/index.js';
import type { LlmProvider } from '../providers/llm-provider.js';
import type { SuggestionCache } from '../repositories/suggestion-cache.js';
import type { FallbackCatalog } from '../services/fallback-catalog.js';
import type { SuggestionGuard } from '../services/suggestion-guard.js';
import { buildSuggestionCacheKey } from '../services/suggestion-cache-key.js';

/**
 * How many extra attempts a safe-but-misshapen answer earns.
 *
 * Not configurable, unlike `LLM_MAX_RETRIES`, which exists because provider
 * outages vary in length and an operator has to be able to tune the wait. This
 * one is a product rule, not an operational dial: the second ask is the whole
 * idea, and a third would spend a user's time and our money on a model that
 * has already shown it cannot meet the contract for this input.
 */
const STYLE_RETRIES = 1;

/** Minimal logging surface, so the domain does not depend on a logging library. */
export interface UseCaseLogger {
  warn(context: Record<string, unknown>, message: string): void;
  error(context: Record<string, unknown>, message: string): void;
}

export interface SuggestMessagesUseCaseOptions {
  readonly llmTimeoutMs: number;
  readonly cacheTtlMs: number;
}

export interface SuggestMessagesUseCaseDeps {
  readonly provider: LlmProvider;
  readonly cache: SuggestionCache;
  readonly fallback: FallbackCatalog;
  readonly guard: SuggestionGuard;
  readonly logger: UseCaseLogger;
  readonly options: SuggestMessagesUseCaseOptions;
}

/**
 * Turns a validated request into gift card message suggestions, and refuses
 * to fail while doing it.
 *
 * The degradation branch is the point of this whole system: when the model
 * cannot deliver, the user still receives usable suggestions plus an honest
 * signal that quality dropped. Nothing here throws for an LLM failure.
 *
 * See docs/01-architecture/decisions/adr-0003-fallback-strategy.md
 */
export class SuggestMessagesUseCase {
  constructor(private readonly deps: SuggestMessagesUseCaseDeps) {}

  async execute(input: SuggestMessagesInput): Promise<SuggestMessagesOutput> {
    const { provider, cache, options } = this.deps;
    const cacheKey = buildSuggestionCacheKey(provider.name, provider.model, input);

    const cached = await cache.get(cacheKey);
    if (cached) {
      return {
        suggestions: cached,
        source: 'llm',
        model: provider.model,
        degraded: false,
        cached: true,
      };
    }

    try {
      const suggestions = await this.callProvider(input);
      await cache.set(cacheKey, suggestions, options.cacheTtlMs);

      return {
        suggestions,
        source: 'llm',
        model: provider.model,
        degraded: false,
        cached: false,
      };
    } catch (error) {
      // Only LLM failures degrade. A bug of ours must still surface as an
      // error, otherwise the fallback would quietly hide our own defects.
      if (!(error instanceof LlmError)) throw error;

      return this.degrade(input, error);
    }
  }

  /**
   * Warn, not error: the provider failed and the system reacted exactly as
   * designed. Alarming on every occurrence would flood the alert channel
   * during someone else's incident. What deserves attention is the RATE of
   * degradation, which this line makes measurable.
   *
   * The single exception is a confirmed system-prompt disclosure, which is
   * not a bad day for a provider — it is evidence that an injection worked,
   * and it should reach a human.
   */
  private degrade(input: SuggestMessagesInput, error: LlmError): SuggestMessagesOutput {
    const context = {
      provider: this.deps.provider.name,
      model: this.deps.provider.model,
      code: error.code,
      reason: error.degradationReason,
      ...(error instanceof LlmOutputBlockedError ? { violation: error.violation } : {}),
    };

    if (error instanceof LlmOutputBlockedError && error.severe) {
      this.deps.logger.error(context, 'LLM output leaked the prompt canary, serving fallback');
    } else {
      this.deps.logger.warn(context, 'LLM failed, serving fallback suggestions');
    }

    return {
      suggestions: this.deps.fallback.get(input),
      source: 'fallback',
      model: null,
      degraded: true,
      cached: false,
      reason: error.degradationReason,
      // Degraded output is never cached: the model may recover in seconds,
      // and caching would keep serving the worst moment for the full TTL.
    };
  }

  /**
   * The timeout is owned here rather than inside each adapter, so no adapter
   * can quietly opt out of it. It covers retries too, which caps the worst
   * case instead of multiplying it by the attempt count.
   *
   * The security guard runs here for the same reason: on the shared path, not
   * inside the adapters, so that it cannot be skipped by forgetting to call
   * it. Its rejection is an LlmError, so it degrades like any other failure.
   *
   * One rejection is worth a second ask, and only one: a message that is safe
   * but too long is a miss, not a failure, and serving a generic catalogue
   * card instead of asking again is a worse answer than the one we threw away.
   * The retry runs under the SAME controller, so the second attempt spends
   * what is left of the budget rather than starting a new one - a model that
   * misses twice on the same input is not going to hit on a third try, and the
   * user is waiting.
   */
  private async callProvider(input: SuggestMessagesInput) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.deps.options.llmTimeoutMs);

    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const suggestions = await this.deps.provider.generateSuggestions(
            input,
            controller.signal,
          );
          this.deps.guard.assertSafe(suggestions);
          return suggestions;
        } catch (error) {
          if (attempt >= STYLE_RETRIES) throw error;
          if (!(error instanceof LlmOutputBlockedError) || !error.recoverable) throw error;

          // Warn rather than swallow: this is the model missing a contract it
          // was given in the prompt, and the rate is worth watching.
          this.deps.logger.warn(
            {
              provider: this.deps.provider.name,
              model: this.deps.provider.model,
              violation: error.violation,
            },
            'LLM output missed the style contract, asking once more',
          );
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
