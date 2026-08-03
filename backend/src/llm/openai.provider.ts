import OpenAI from 'openai';
import { config } from '../config/env';
import { buildMessages } from '../prompt/buildPrompt';
import { SuggestionRequest } from '../types';
import { LlmError, LlmProvider } from './llm.provider';

/**
 * OpenAI implementation of {@link LlmProvider}.
 *
 * Responsibilities kept here (and nowhere else):
 *  - vendor SDK wiring and the timeout/abort,
 *  - mapping SDK/HTTP errors onto our normalized {@link LlmError} kinds,
 *  - parsing the model output into a clean `string[]`.
 */
export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;

  constructor(apiKey: string = config.llm.openai.apiKey) {
    this.client = new OpenAI({ apiKey, baseURL: config.llm.openai.baseUrl });
  }

  async generateSuggestions(input: SuggestionRequest): Promise<string[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.llm.timeoutMs);

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: config.llm.openai.model,
          temperature: 0.8,
          max_tokens: 220,
          response_format: { type: 'json_object' },
          messages: buildMessages(input),
        },
        { signal: controller.signal },
      );

      const raw = completion.choices[0]?.message?.content ?? '';
      return parseSuggestions(raw);
    } catch (err) {
      throw mapOpenAiError(err);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * The prompt instructs the model to answer with JSON like
 * `{ "suggestions": ["...", "..."] }`. We parse defensively and validate the
 * shape; anything off-contract becomes an `invalid_output` failure so the
 * service falls back rather than forwarding garbage to the client.
 */
export function parseSuggestions(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new LlmError('invalid_output', 'LLM returned non-JSON content');
  }

  const list = (parsed as { suggestions?: unknown })?.suggestions;
  if (!Array.isArray(list)) {
    throw new LlmError('invalid_output', 'LLM output missing "suggestions" array');
  }

  const cleaned = list
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 3);

  if (cleaned.length < 2) {
    throw new LlmError('invalid_output', 'LLM returned fewer than 2 usable suggestions');
  }
  return cleaned;
}

/** Maps OpenAI SDK / network errors to our normalized error kinds. */
export function mapOpenAiError(err: unknown): LlmError {
  if (err instanceof LlmError) return err;

  const anyErr = err as { name?: string; status?: number; code?: string };

  if (anyErr?.name === 'AbortError' || anyErr?.code === 'ETIMEDOUT') {
    return new LlmError('timeout', 'LLM request timed out', err);
  }
  const status = anyErr?.status;
  if (status === 429) return new LlmError('rate_limited', 'LLM rate limit exceeded', err);
  if (typeof status === 'number' && status >= 500) {
    return new LlmError('upstream', `LLM upstream error (${status})`, err);
  }
  return new LlmError('unknown', 'Unexpected LLM failure', err);
}
