import type { Express } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SuggestMessagesInput } from '../../src/domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../src/domain/entities/suggestion.js';
import {
  LlmAuthError,
  LlmInvalidResponseError,
  LlmRateLimitError,
  LlmTimeoutError,
  LlmUnavailableError,
} from '../../src/domain/errors/index.js';
import type { LlmProvider } from '../../src/domain/providers/llm-provider.js';
import { buildTestApp } from '../helpers/build-test-app.js';

const endpoint = '/api/v1/suggestions';
const validBody = { occasion: 'birthday', relationship: 'friend' };

function failingWith(error: Error): LlmProvider {
  return {
    name: 'openai',
    model: 'gpt-4o-mini',
    async generateSuggestions(): Promise<Suggestion[]> {
      throw error;
    },
  };
}

function appWith(provider: LlmProvider, env: Record<string, string> = {}): Express {
  return buildTestApp({ llmProvider: provider, env });
}

/**
 * The requirement the brief singles out:
 *
 *   "at least one test that covers the fallback path when the LLM fails"
 *
 * There are five ways this system recognises an LLM failing, and each one is
 * exercised here at the HTTP boundary rather than only inside the use case —
 * because what a client experiences is the response, not the call.
 */
describe('the LLM fails and the caller still gets a card message', () => {
  const failures: Array<[string, Error, string]> = [
    ['the provider takes too long', new LlmTimeoutError(8000), 'llm_timeout'],
    ['the provider rate limits us', new LlmRateLimitError(), 'llm_rate_limited'],
    ['the provider is down', new LlmUnavailableError(), 'llm_unavailable'],
    ['the provider answers nonsense', new LlmInvalidResponseError(), 'llm_invalid_response'],
    ['our credential is rejected', new LlmAuthError(), 'llm_auth_error'],
  ];

  it.each(failures)('answers 200 with suggestions when %s', async (_label, error, reason) => {
    const response = await request(appWith(failingWith(error)))
      .post(endpoint)
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.data.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data.degraded).toBe(true);
    expect(response.body.data.source).toBe('fallback');
    expect(response.body.data.model).toBeNull();
    expect(response.body.meta.reason).toBe(reason);
  });

  /**
   * `reason` is the whole point of the flag: a client that wants to show
   * "we're having trouble, here are some classics" needs a stable code to
   * branch on, not a message someone may reword next week.
   */
  it.each(failures)('reports a stable reason code when %s', async (_label, error, reason) => {
    const response = await request(appWith(failingWith(error)))
      .post(endpoint)
      .send(validBody);

    expect(response.body.meta.reason).toBe(reason);
    expect(response.body.meta.reason).toMatch(/^llm_[a-z_]+$/);
  });

  it.each(failures)('never exposes the raw error when %s', async (_label, error) => {
    const response = await request(appWith(failingWith(error)))
      .post(endpoint)
      .send(validBody);
    const body = JSON.stringify(response.body);

    expect(body).not.toMatch(/\bat \w+ \(/);
    expect(body).not.toMatch(/\.ts:\d+|\.js:\d+/);
    expect(body).not.toMatch(/openai|gemini|openrouter/i);
    expect(body).not.toContain(error.message);
    expect(body).not.toContain('node_modules');
  });

  it.each(failures)('still returns a correlation id when %s', async (_label, error) => {
    const response = await request(appWith(failingWith(error)))
      .post(endpoint)
      .send(validBody);

    expect(response.body.meta.requestId).toMatch(/^req_/);
  });
});

describe('the degraded response is still a usable product', () => {
  it('honours count', async () => {
    const response = await request(appWith(failingWith(new LlmTimeoutError(8000))))
      .post(endpoint)
      .send({ ...validBody, count: 2 });

    expect(response.body.data.suggestions).toHaveLength(2);
  });

  it('answers in the requested language', async () => {
    const response = await request(appWith(failingWith(new LlmUnavailableError())))
      .post(endpoint)
      .send({ occasion: 'aniversário', relationship: 'amigo', language: 'pt' });

    expect(response.body.data.suggestions.some((s: Suggestion) => /anivers/i.test(s.text))).toBe(
      true,
    );
  });

  it('writes text relevant to the occasion, not a generic apology', async () => {
    const response = await request(appWith(failingWith(new LlmRateLimitError())))
      .post(endpoint)
      .send(validBody);

    const texts = response.body.data.suggestions.map((s: Suggestion) => s.text).join(' ');
    expect(texts).toMatch(/birthday/i);
    expect(texts).not.toMatch(/error|sorry|unavailable|try again/i);
  });

  it('gives every fallback suggestion an id and text, like any other response', async () => {
    const response = await request(appWith(failingWith(new LlmAuthError())))
      .post(endpoint)
      .send(validBody);

    for (const suggestion of response.body.data.suggestions) {
      expect(suggestion.id).toBeTruthy();
      expect(suggestion.text.trim().length).toBeGreaterThan(0);
    }
  });

  /**
   * Caching a degraded answer would freeze the system's worst moment for the
   * whole TTL, long after the provider recovered.
   */
  it('is never cached', async () => {
    const app = appWith(failingWith(new LlmUnavailableError()), { CACHE_ENABLED: 'true' });

    await request(app).post(endpoint).send(validBody);
    const second = await request(app).post(endpoint).send(validBody);

    expect(second.body.meta.cached).toBe(false);
    expect(second.body.data.degraded).toBe(true);
  });
});

/**
 * The timeout tests above inject an already-thrown `LlmTimeoutError`, which
 * proves the reaction and not the wiring. This one proves the wiring: the use
 * case really does start a clock and really does abort the call when it runs
 * out.
 *
 * A provider that hangs forever would hang the test if the abort were missing,
 * so the assertion is the absence of a hang as much as the response body.
 */
describe('the timeout is enforced, not merely handled', () => {
  it('aborts a provider that never answers and degrades', async () => {
    const hanging: LlmProvider = {
      name: 'openai',
      model: 'gpt-4o-mini',
      generateSuggestions(
        _input: SuggestMessagesInput,
        signal?: AbortSignal,
      ): Promise<Suggestion[]> {
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new LlmTimeoutError(50)));
        });
      },
    };

    const started = Date.now();
    const response = await request(appWith(hanging, { LLM_TIMEOUT_MS: '50' }))
      .post(endpoint)
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.meta.reason).toBe('llm_timeout');
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

/**
 * The failure has to survive the real adapter, not just a double that throws.
 * These drive `OpenAiProvider` with a stubbed `fetch`, so the whole chain runs:
 * HTTP status or body -> error mapping -> use case -> fallback -> response.
 */
describe('a real adapter failing degrades the same way', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function appWithRealAdapter(): Express {
    return buildTestApp({
      env: { LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key', LLM_MAX_RETRIES: '0' },
    });
  }

  it.each([
    ['a 500 from the provider', () => new Response('upstream exploded', { status: 500 })],
    ['a 429 from the provider', () => new Response('slow down', { status: 429 })],
    ['a 401 from the provider', () => new Response('bad key', { status: 401 })],
    ['an HTML error page instead of JSON', () => new Response('<html>502</html>', { status: 200 })],
    [
      'valid JSON that is not the shape we asked for',
      () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '{"nope":true}' } }] }), {
          status: 200,
        }),
    ],
    [
      'a completion with the wrong number of suggestions',
      () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify({ suggestions: ['only one'] }) } }],
          }),
          { status: 200 },
        ),
    ],
  ])('degrades on %s', async (_label, respond) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(respond())),
    );

    const response = await request(appWithRealAdapter()).post(endpoint).send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.data.degraded).toBe(true);
    expect(response.body.data.source).toBe('fallback');
  });

  it('degrades when the network itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
    );

    const response = await request(appWithRealAdapter()).post(endpoint).send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.meta.reason).toBe('llm_unavailable');
  });

  it('never leaks the credential when the provider rejects it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('invalid api key: test-key', { status: 401 }))),
    );

    const response = await request(appWithRealAdapter()).post(endpoint).send(validBody);

    expect(JSON.stringify(response.body)).not.toContain('test-key');
  });
});

/**
 * The fallback exists for a provider failing, never for a caller mistake.
 * Serving suggestions for an invalid request would hide the caller's bug
 * behind a plausible answer.
 */
describe('a bad request never degrades', () => {
  it.each([
    ['an empty body', {}],
    ['a missing relationship', { occasion: 'birthday' }],
    ['a count out of range', { ...validBody, count: 9 }],
    ['an unknown tone', { ...validBody, tone: 'sarcastic' }],
    ['an occasion that is too long', { ...validBody, occasion: 'a'.repeat(61) }],
  ])('answers 400 for %s, with no suggestions', async (_label, body) => {
    const response = await request(buildTestApp()).post(endpoint).send(body);

    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('suggestions');
  });
});

/**
 * What the client sees when the model writes something safe but too long.
 *
 * The unit tests pin the decision; this pins the answer that leaves the
 * process, because a caller experiences the response and not the branch.
 */
describe('a message that is only misshapen never reaches the client as a degradation', () => {
  const tooLong: Suggestion[] = [
    { id: 'sug_1', text: 'Happy birthday. You are older now. Enjoy the cake.' },
    { id: 'sug_2', text: 'Have a great one.' },
    { id: 'sug_3', text: 'Wishing you the best.' },
  ];
  const fine: Suggestion[] = [
    { id: 'sug_1', text: 'Happy birthday! Have a great one.' },
    { id: 'sug_2', text: 'Wishing you the best.' },
    { id: 'sug_3', text: 'Many happy returns.' },
  ];

  function answering(...answers: Suggestion[][]): LlmProvider {
    let call = 0;
    return {
      name: 'openai',
      model: 'gpt-4o-mini',
      async generateSuggestions(): Promise<Suggestion[]> {
        const answer = answers[Math.min(call, answers.length - 1)]!;
        call += 1;
        return answer;
      },
    };
  }

  it('answers 200 with the model behind it, after asking once more', async () => {
    const response = await request(appWith(answering(tooLong, fine)))
      .post(endpoint)
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.data.degraded).toBe(false);
    expect(response.body.data.source).toBe('llm');
    expect(response.body.data.suggestions).toHaveLength(3);
    expect(response.body.meta.reason).toBeUndefined();
  });

  it('still degrades, identically to any other bad completion, when it misses twice', async () => {
    const response = await request(appWith(answering(tooLong, tooLong)))
      .post(endpoint)
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.data.degraded).toBe(true);
    expect(response.body.data.source).toBe('fallback');
    expect(response.body.meta.reason).toBe('llm_invalid_response');
  });

  it('never serves the sentence the guard refused', async () => {
    const response = await request(appWith(answering(tooLong, tooLong)))
      .post(endpoint)
      .send(validBody);

    expect(JSON.stringify(response.body)).not.toContain('Enjoy the cake');
  });
});
