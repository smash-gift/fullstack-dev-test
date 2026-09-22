import { randomUUID } from 'node:crypto';
import { guardSuggestions } from '../application/output-guard.js';
import { UpstreamFailure } from '../domain/errors.js';
import type { GeneratedSuggestions, LlmProvider } from '../domain/ports.js';
import type { SuggestionRequest } from '../domain/suggestion.js';
import { PROMPT_VERSION, buildSystemInstruction, buildUserContent } from './prompt.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['suggestions'],
} as const;

type Attempt =
  { kind: 'ok'; payload: unknown } | { kind: 'failed'; error: UpstreamFailure; retryable: boolean };

export interface GeminiProviderOptions {
  apiKey: string;
  model: string;
  maxRetries: number;
  fetchImpl?: typeof fetch;
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

function backoffMs(attempt: number): number {
  return 250 * 2 ** attempt + Math.floor(Math.random() * 150);
}

export class GeminiProvider implements LlmProvider {
  readonly promptVersion = PROMPT_VERSION;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: GeminiProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  get isConfigured(): boolean {
    return this.options.apiKey.length > 0;
  }

  get model(): string {
    return this.options.model;
  }

  async generate(request: SuggestionRequest, signal: AbortSignal): Promise<GeneratedSuggestions> {
    const canary = randomUUID().replaceAll('-', '').slice(0, 12);
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemInstruction(request, canary) }] },
      contents: [{ role: 'user', parts: [{ text: buildUserContent(request) }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const payload = await this.post(body, signal);
    const parsed = this.parse(payload);

    return {
      suggestions: guardSuggestions(parsed, { canary, expected: request.count }),
      model: this.options.model,
      promptVersion: PROMPT_VERSION,
    };
  }

  private async post(body: string, signal: AbortSignal): Promise<unknown> {
    const url = `${ENDPOINT}/${encodeURIComponent(this.options.model)}:generateContent`;
    let lastError: UpstreamFailure | undefined;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt += 1) {
      if (signal.aborted) throw new UpstreamFailure('timeout', 'Time budget spent before the call');

      const outcome = await this.attempt(url, body, signal);
      if (outcome.kind === 'ok') return outcome.payload;

      lastError = outcome.error;
      if (!outcome.retryable) throw lastError;

      if (attempt < this.options.maxRetries) {
        await this.wait(backoffMs(attempt), signal);
      }
    }

    throw lastError ?? new UpstreamFailure('upstream_error', 'Gemini call failed');
  }

  private async attempt(url: string, body: string, signal: AbortSignal): Promise<Attempt> {
    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.options.apiKey },
        body,
        signal,
      });

      if (response.ok) return { kind: 'ok', payload: await response.json() };

      // The body can carry the key or account details, so it is read only to
      // drain the connection and never propagated to the client.
      await response.text().catch(() => '');

      const reason = response.status === 429 ? 'rate_limited' : 'upstream_error';
      return {
        kind: 'failed',
        error: new UpstreamFailure(reason, `Gemini responded with ${response.status}`),
        retryable: isRetryable(response.status),
      };
    } catch (error) {
      if (signal.aborted || (error as Error)?.name === 'AbortError') {
        throw new UpstreamFailure('timeout', 'Gemini call exceeded the time budget', error);
      }
      return {
        kind: 'failed',
        error: new UpstreamFailure('upstream_error', 'Gemini call failed', error),
        retryable: true,
      };
    }
  }

  private parse(payload: unknown): unknown {
    const text = (payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      ?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== 'string') {
      throw new UpstreamFailure('invalid_output', 'Gemini response had no text part');
    }

    try {
      const parsed = JSON.parse(text) as { suggestions?: unknown };
      return parsed.suggestions;
    } catch (error) {
      throw new UpstreamFailure('invalid_output', 'Gemini response was not valid JSON', error);
    }
  }

  private wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new UpstreamFailure('timeout', 'Time budget spent while backing off'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }
}
