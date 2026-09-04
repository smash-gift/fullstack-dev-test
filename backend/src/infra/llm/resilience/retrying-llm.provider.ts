import type { SuggestMessagesInput } from '../../../domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../../domain/entities/suggestion.js';
import { LlmUnavailableError } from '../../../domain/errors/index.js';
import type { LlmProvider } from '../../../domain/providers/llm-provider.js';
import type { Logger } from '../../../pkg/logger/logger.js';

export interface RetryingLlmProviderOptions {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly logger: Logger;
  /** Injectable so tests do not sleep in real time. */
  readonly random?: () => number;
}

/**
 * Retries transient provider failures.
 *
 * A decorator rather than logic inside the use case: it satisfies
 * `LlmProvider` itself, so it wraps any adapter and the use case cannot tell
 * it is there. That is the port earning its keep.
 *
 * Only `LlmUnavailableError` is retried — 5xx, refused connections, DNS
 * failures. Everything else is deliberately left alone:
 *
 * | Failure          | Retry | Why not                                     |
 * |------------------|-------|---------------------------------------------|
 * | Timeout          | no    | The time budget is already spent, by definition |
 * | 429              | no    | Retrying into a rate limit makes it worse   |
 * | Auth             | no    | A wrong key stays wrong; retrying only delays diagnosis |
 * | Invalid response | no    | The same prompt tends to produce the same bad format, billed twice |
 *
 * The AbortSignal covers the WHOLE operation, retries included, so the worst
 * case stays at LLM_TIMEOUT_MS rather than multiplying by the attempt count.
 * A user staring at a spinner should not pay for our retry policy.
 */
export class RetryingLlmProvider implements LlmProvider {
  constructor(
    private readonly inner: LlmProvider,
    private readonly options: RetryingLlmProviderOptions,
  ) {}

  get name(): string {
    return this.inner.name;
  }

  get model(): string {
    return this.inner.model;
  }

  async generateSuggestions(
    input: SuggestMessagesInput,
    signal: AbortSignal,
  ): Promise<Suggestion[]> {
    let attempt = 0;

    for (;;) {
      try {
        return await this.inner.generateSuggestions(input, signal);
      } catch (error) {
        const canRetry = error instanceof LlmUnavailableError && attempt < this.options.maxRetries;

        if (!canRetry || signal.aborted) throw error;

        attempt += 1;
        this.options.logger.warn(
          { provider: this.inner.name, attempt, reason: error.code },
          'retrying LLM request after a transient failure',
        );

        await this.wait(this.delayFor(attempt), signal);
      }
    }
  }

  /** Full jitter, so simultaneous clients do not retry in lockstep. */
  private delayFor(attempt: number): number {
    const random = this.options.random ?? Math.random;
    return Math.round(this.options.baseDelayMs * attempt * random());
  }

  /** Abortable: sleeping past the time budget would defeat the timeout. */
  private wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(finish, ms);
      signal.addEventListener('abort', finish, { once: true });

      function finish(): void {
        clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      }
    });
  }
}
