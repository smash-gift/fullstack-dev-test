import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('HTTP API', () => {
  let app: ReturnType<typeof buildApp> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('returns health status', async () => {
    app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('rejects an invalid request without calling the provider', async () => {
    let calls = 0;
    app = buildApp({
      logger: false,
      llmClient: {
        generateSuggestions: async () => {
          calls += 1;
          return ['should not be called'];
        },
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/suggestions',
      payload: { occasion: 'x' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');
    expect(calls).toBe(0);
  });

  it('rejects malformed JSON with a safe 400 response', async () => {
    app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/api/suggestions',
      headers: { 'content-type': 'application/json' },
      payload: '{"occasion":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'The request body must be valid JSON.',
      },
    });
  });

  it('returns a fallback when no provider key is configured', async () => {
    app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/api/suggestions',
      payload: { occasion: 'aniversário', relationship: 'amigo' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ source: 'fallback', fallback: true });
    expect(response.json().suggestions).toHaveLength(3);
  });

  it('returns 429 after the configured request limit', async () => {
    app = buildApp({ logger: false, rateLimitMax: 1 });
    const payload = { occasion: 'aniversário', relationship: 'amigo' };

    const first = await app.inject({ method: 'POST', url: '/api/suggestions', payload });
    const second = await app.inject({ method: 'POST', url: '/api/suggestions', payload });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(429);
    expect(second.json().error.code).toBe('RATE_LIMITED');
  });
});
