import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app.js';

const endpoint = '/api/v1/suggestions';
const validBody = { occasion: 'birthday', relationship: 'friend' };

/** A limit small enough to exhaust in a test without waiting on a real window. */
function appWithLimit(max: number, extra: Record<string, string> = {}): Express {
  return buildTestApp({
    env: { RATE_LIMIT_ENABLED: 'true', RATE_LIMIT_MAX: String(max), ...extra },
  });
}

async function post(app: Express) {
  return request(app).post(endpoint).send(validBody);
}

describe('rate limiting', () => {
  it('serves up to the limit and blocks the next request', async () => {
    const app = appWithLimit(3);

    for (let i = 0; i < 3; i += 1) {
      expect((await post(app)).status).toBe(200);
    }

    expect((await post(app)).status).toBe(429);
  });

  it('answers 429 in the same error shape as every other failure', async () => {
    const app = appWithLimit(1);
    await post(app);

    const response = await post(app);

    expect(response.body.error.code).toBe('RATE_LIMITED');
    expect(response.body.error.message).toBe('Too many requests. Please try again later.');
    expect(response.body.meta.requestId).toMatch(/^req_/);
  });

  /**
   * The brief asks for the behaviour on exceeding the limit to be documented.
   * `Retry-After` is that documentation in machine-readable form; the same
   * number is repeated in the body for clients that read JSON more comfortably
   * than headers.
   */
  it('says when to come back, in a header and in the body', async () => {
    const app = appWithLimit(1, { RATE_LIMIT_WINDOW_MS: '60000' });
    await post(app);

    const response = await post(app);
    const retryAfter = Number(response.headers['retry-after']);

    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(response.body.error.details.retryAfterSeconds).toBe(retryAfter);
  });

  it('publishes the remaining budget on every allowed response', async () => {
    const app = appWithLimit(3);

    const first = await post(app);
    const second = await post(app);

    expect(first.headers['ratelimit-limit']).toBe('3');
    expect(first.headers['ratelimit-remaining']).toBe('2');
    expect(second.headers['ratelimit-remaining']).toBe('1');
    expect(first.headers['ratelimit-reset']).toBeDefined();
  });

  /**
   * A 429 that serves suggestions anyway would undo the limit and teach the
   * client that insisting works. The whole point of the control is that the
   * blocked request never reaches the model.
   */
  it('does not degrade to fallback suggestions', async () => {
    const app = appWithLimit(1);
    await post(app);

    const response = await post(app);

    expect(response.body.data).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('suggestions');
  });

  it('leaves /health outside the limit, so a health check cannot lock the service out', async () => {
    const app = appWithLimit(1);
    await post(app);
    expect((await post(app)).status).toBe(429);

    for (let i = 0; i < 5; i += 1) {
      expect((await request(app).get('/health')).status).toBe(200);
    }
  });

  it('leaves /docs outside the limit', async () => {
    const app = appWithLimit(1);
    await post(app);
    await post(app);

    expect((await request(app).get('/docs')).status).toBe(200);
    expect((await request(app).get('/docs/openapi.json')).status).toBe(200);
  });

  /**
   * CORS runs before the limiter on purpose. Without those headers a browser
   * reports a CORS failure and the client never learns it was rate limited —
   * the wrong diagnosis for the right problem.
   */
  it('keeps CORS headers on a blocked response', async () => {
    const app = appWithLimit(1);
    await post(app);

    const response = await request(app)
      .post(endpoint)
      .set('Origin', 'http://localhost:54321')
      .send(validBody);

    expect(response.status).toBe(429);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  /** A preflight is browser overhead, not work. Charging for it would halve a
   * web client's real budget. */
  it('does not spend quota on a CORS preflight', async () => {
    const app = appWithLimit(2);

    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .options(endpoint)
        .set('Origin', 'http://localhost:54321')
        .set('Access-Control-Request-Method', 'POST');
    }

    expect((await post(app)).status).toBe(200);
    expect((await post(app)).status).toBe(200);
  });

  it('can be switched off entirely', async () => {
    const app = buildTestApp({ env: { RATE_LIMIT_ENABLED: 'false' } });

    for (let i = 0; i < 40; i += 1) {
      expect((await post(app)).status).toBe(200);
    }

    expect((await post(app)).headers['ratelimit-limit']).toBeUndefined();
  });

  it('counts each client separately', async () => {
    const app = appWithLimit(1, { TRUST_PROXY_HOPS: '1' });

    const first = await request(app)
      .post(endpoint)
      .set('X-Forwarded-For', '203.0.113.10')
      .send(validBody);
    const second = await request(app)
      .post(endpoint)
      .set('X-Forwarded-For', '203.0.113.11')
      .send(validBody);
    const third = await request(app)
      .post(endpoint)
      .set('X-Forwarded-For', '203.0.113.10')
      .send(validBody);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });

  /**
   * With no proxy configured, a forged `X-Forwarded-For` must not create a new
   * identity — otherwise the limit is one header away from being bypassed.
   */
  it('ignores a forged X-Forwarded-For when no proxy is configured', async () => {
    const app = appWithLimit(2);

    await request(app).post(endpoint).set('X-Forwarded-For', '203.0.113.1').send(validBody);
    await request(app).post(endpoint).set('X-Forwarded-For', '203.0.113.2').send(validBody);
    const third = await request(app)
      .post(endpoint)
      .set('X-Forwarded-For', '203.0.113.3')
      .send(validBody);

    expect(third.status).toBe(429);
  });
});
