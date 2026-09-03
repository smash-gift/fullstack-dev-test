import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app.js';

describe('GET /health', () => {
  it('reports the service as healthy', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.version).toBeDefined();
    expect(response.body.llmProvider).toBe('stub');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });
});

describe('unknown routes', () => {
  it('returns a structured 404', async () => {
    const response = await request(buildTestApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.meta.requestId).toMatch(/^req_/);
  });
});

describe('response hygiene', () => {
  it('does not advertise the framework', async () => {
    const response = await request(buildTestApp()).get('/health');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('never returns a stack trace', async () => {
    const response = await request(buildTestApp())
      .post('/api/v1/suggestions')
      .send({ occasion: 'birthday' });

    const body = JSON.stringify(response.body);
    expect(body).not.toMatch(/at .*\(.*:\d+:\d+\)/);
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain(process.cwd());
  });

  it('answers CORS preflight', async () => {
    const response = await request(buildTestApp())
      .options('/api/v1/suggestions')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBeLessThan(300);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
