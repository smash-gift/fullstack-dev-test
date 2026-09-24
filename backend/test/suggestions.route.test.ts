import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig, resetConfigCache } from '../src/lib/config.js';
import { buildServer } from '../src/server.js';
import { SuggestionService } from '../src/services/suggestion.service.js';
import type { LlmProvider } from '../src/types.js';

/** Build a test server with a fallback-only service (no real network). */
async function makeServer(
  llm?: LlmProvider,
  env: NodeJS.ProcessEnv = {},
): Promise<FastifyInstance> {
  resetConfigCache();
  const config = loadConfig({
    RATE_LIMIT_MAX: '1000',
    LOG_LEVEL: 'error',
    ...env,
  });
  const service = new SuggestionService({ llm, cacheTtlMs: 0 });
  return buildServer({ config, service });
}

describe('POST /api/suggestions', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    resetConfigCache();
  });

  it('returns 200 with fallback suggestions when the LLM fails', async () => {
    const failing: LlmProvider = {
      name: 'failing',
      generateSuggestions: () => Promise.reject(new Error('down')),
    };
    app = await makeServer(failing);

    const res = await app.inject({
      method: 'POST',
      url: '/api/suggestions',
      payload: { occasion: 'birthday', relationship: 'friend' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ suggestions: string[]; source: string }>();
    expect(body.source).toBe('fallback');
    expect(body.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('returns 400 with INVALID_INPUT for an invalid body', async () => {
    app = await makeServer();

    const res = await app.inject({
      method: 'POST',
      url: '/api/suggestions',
      payload: { occasion: '' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('never leaks a raw provider error to the client', async () => {
    const leaky: LlmProvider = {
      name: 'leaky',
      generateSuggestions: () =>
        Promise.reject(new Error('SECRET stack trace with api key')),
    };
    app = await makeServer(leaky);

    const res = await app.inject({
      method: 'POST',
      url: '/api/suggestions',
      payload: { occasion: 'wedding', relationship: 'colleague' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.payload).not.toContain('SECRET');
  });
});

describe('rate limiting', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    resetConfigCache();
  });

  it('returns 429 RATE_LIMITED once the limit is exceeded', async () => {
    app = await makeServer(undefined, { RATE_LIMIT_MAX: '2' });

    const call = (): ReturnType<FastifyInstance['inject']> =>
      app!.inject({
        method: 'POST',
        url: '/api/suggestions',
        payload: { occasion: 'birthday', relationship: 'friend' },
      });

    await call();
    await call();
    const third = await call();

    expect(third.statusCode).toBe(429);
    const body = third.json<{ error: { code: string } }>();
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});

describe('GET /health', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    resetConfigCache();
  });

  it('reports status ok', async () => {
    app = await makeServer();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ status: string }>().status).toBe('ok');
  });
});
