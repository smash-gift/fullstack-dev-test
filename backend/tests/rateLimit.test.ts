import request from 'supertest';

/**
 * Rate limiting is applied globally before the routes, so `/api/health` is
 * enough to exercise it without touching the LLM. We re-import the app with a
 * low limit so the test is fast and deterministic.
 */
describe('rate limiting', () => {
  const originalMax = process.env.RATE_LIMIT_MAX;

  afterEach(() => {
    process.env.RATE_LIMIT_MAX = originalMax;
    jest.resetModules();
  });

  it('allows requests up to the limit, then returns 429 with Retry-After', async () => {
    jest.resetModules();
    process.env.RATE_LIMIT_MAX = '3';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    const { createApp } = await import('../src/app');
    const app = createApp();

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    }

    const limited = await request(app).get('/api/health');
    expect(limited.status).toBe(429);
    expect(limited.body.error).toBe('rate_limited');
    expect(limited.headers['retry-after']).toBeDefined();
  });
});
