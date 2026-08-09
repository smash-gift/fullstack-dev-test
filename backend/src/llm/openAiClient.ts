import type { LlmClient, Logger, SuggestionRequest } from '../domain/types';
import {
  LlmConfigurationError,
  LlmError,
  LlmNetworkError,
  LlmRateLimitError,
  LlmServerError,
  LlmTimeoutError,
} from './errors';
import { buildPrompt, RESPONSE_SCHEMA } from './promptBuilder';
import { parseCompletion } from './responseParser';

const COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const RETRY_DELAY_MS = 500;
const MAX_OUTPUT_TOKENS = 300;

/** High enough for variety between calls, low enough to stay on topic. */
const TEMPERATURE = 0.8;

export interface OpenAiClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  logger: Logger;
  /** Injected in tests so no call ever leaves the machine. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export class OpenAiClient implements LlmClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly options: OpenAiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * One retry, and only for failures that a second attempt can plausibly fix.
   * A bad key or a malformed answer fails the same way every time, so retrying
   * those would just spend another timeout budget before the same fallback.
   */
  async generate(input: SuggestionRequest): Promise<string[]> {
    try {
      return await this.callOnce(input);
    } catch (error) {
      if (!(error instanceof LlmError) || !error.retryable) {
        throw error;
      }

      this.options.logger.warn('llm_retrying', { reason: error.name });
      await this.sleep(RETRY_DELAY_MS);
      return this.callOnce(input);
    }
  }

  private async callOnce(input: SuggestionRequest): Promise<string[]> {
    const prompt = buildPrompt(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(COMPLETIONS_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model,
          temperature: TEMPERATURE,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
        }),
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new LlmTimeoutError(`Request aborted after ${this.options.timeoutMs}ms`);
      }
      throw new LlmNetworkError(reasonOf(error));
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw await this.errorForStatus(response);
    }

    return parseCompletion(await response.json());
  }

  /**
   * Maps a failed response to an error.
   *
   * The provider's own message is logged but never carried into the thrown
   * error, so it cannot end up in a client response by accident.
   */
  private async errorForStatus(response: Response): Promise<LlmError> {
    const detail = await response.text().catch(() => '');
    this.options.logger.warn('llm_http_error', {
      status: response.status,
      detail: detail.slice(0, 500),
    });

    if (response.status === 429) {
      // OpenAI answers 429 both for "you are going too fast" and for "this
      // account is out of credit". Only the first is worth retrying; the second
      // would just spend another timeout budget on a certain failure.
      return isQuotaExhausted(detail)
        ? new LlmConfigurationError('Provider reports the account has no quota left')
        : new LlmRateLimitError('Provider rate limited the request');
    }

    if (response.status >= 500) {
      return new LlmServerError(`Provider returned ${response.status}`);
    }

    return new LlmConfigurationError(`Provider rejected the request with ${response.status}`);
  }
}

function isQuotaExhausted(detail: string): boolean {
  try {
    const parsed = JSON.parse(detail) as { error?: { type?: unknown; code?: unknown } };
    const markers = [parsed.error?.type, parsed.error?.code].map((value) => String(value ?? ''));
    return markers.some(
      (marker) => marker === 'insufficient_quota' || marker === 'credit_balance_exhausted',
    );
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown network failure';
}
