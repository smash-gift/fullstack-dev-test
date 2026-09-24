import { GoogleGenAI } from '@google/genai';
import type { AppConfig } from '../lib/config.js';
import {
  LlmInvalidResponseError,
  LlmRateLimitError,
  LlmTimeoutError,
  LlmUnavailableError,
} from '../lib/errors.js';
import {
  RESPONSE_JSON_SCHEMA,
  SYSTEM_INSTRUCTION,
  buildPrompt,
} from '../lib/prompt.js';
import { llmOutputSchema, type LlmProvider, type SuggestionRequest } from '../types.js';

/** Sleep helper for backoff. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sentinel used to detect our own timeout in a Promise.race. */
const TIMEOUT = Symbol('llm-timeout');

/**
 * Races a promise against a timeout. Resolves to the sentinel when the timeout
 * wins. Guarantees the caller never waits longer than `ms`, independent of the
 * SDK's own timeout handling.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | typeof TIMEOUT> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<typeof TIMEOUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Extracts an HTTP-ish status code from whatever shape the SDK/network throws.
 * The SDK is not perfectly typed, so we probe common fields defensively.
 */
function statusOf(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const e = err as Record<string, unknown>;
  const candidates = [e['status'], e['statusCode'], e['code']];
  for (const c of candidates) {
    if (typeof c === 'number') return c;
    if (typeof c === 'string' && /^\d+$/.test(c)) return Number(c);
  }
  return undefined;
}

/**
 * Real LLM provider backed by Google Gemini. Applies an explicit timeout and a
 * bounded exponential backoff retry on transient failures only. Every failure
 * mode is translated into a typed domain error so the service layer can decide
 * to fall back — raw SDK errors never propagate.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenAI;

  constructor(private readonly config: AppConfig) {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GeminiProvider requires GEMINI_API_KEY');
    }
    this.client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }

  async generateSuggestions(input: SuggestionRequest): Promise<string[]> {
    const maxAttempts = this.config.LLM_MAX_RETRIES + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.callOnce(input);
      } catch (err) {
        lastError = err;
        const retryable =
          err instanceof LlmTimeoutError ||
          err instanceof LlmRateLimitError ||
          err instanceof LlmUnavailableError;

        if (!retryable || attempt === maxAttempts - 1) throw err;

        // Exponential backoff: 250ms, 500ms, 1000ms, ...
        await delay(250 * 2 ** attempt);
      }
    }

    // Unreachable, but keeps the type checker happy.
    throw lastError instanceof Error
      ? lastError
      : new LlmUnavailableError('LLM call failed');
  }

  private async callOnce(input: SuggestionRequest): Promise<string[]> {
    let raw: string | undefined;
    try {
      const result = await withTimeout(
        this.client.models.generateContent({
          model: this.config.GEMINI_MODEL,
          contents: buildPrompt(input),
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_JSON_SCHEMA,
            temperature: 0.9,
            maxOutputTokens: 512,
            // SDK-level timeout as a first line of defence.
            httpOptions: { timeout: this.config.LLM_TIMEOUT_MS },
          },
        }),
        this.config.LLM_TIMEOUT_MS,
      );

      if (result === TIMEOUT) {
        throw new LlmTimeoutError('Gemini request timed out');
      }
      raw = result.text;
    } catch (err) {
      if (err instanceof LlmTimeoutError) throw err;
      throw this.classify(err);
    }

    return this.parse(raw);
  }

  /** Maps SDK/network errors to typed domain errors. */
  private classify(
    err: unknown,
  ): LlmRateLimitError | LlmUnavailableError {
    const status = statusOf(err);
    if (status === 429) {
      return new LlmRateLimitError('Gemini rate limited', { cause: err });
    }
    if (status !== undefined && status >= 500) {
      return new LlmUnavailableError('Gemini server error', { cause: err });
    }
    // Network errors (no status) are treated as transient/unavailable.
    return new LlmUnavailableError('Gemini request failed', { cause: err });
  }

  /** Parses and validates the model output; malformed output is not retryable. */
  private parse(raw: string | undefined): string[] {
    if (!raw || raw.trim().length === 0) {
      throw new LlmInvalidResponseError('Gemini returned an empty response');
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      throw new LlmInvalidResponseError('Gemini returned invalid JSON', {
        cause: err,
      });
    }

    const parsed = llmOutputSchema.safeParse(json);
    if (!parsed.success) {
      throw new LlmInvalidResponseError(
        'Gemini output failed schema validation',
        { cause: parsed.error },
      );
    }
    return parsed.data.suggestions;
  }
}
