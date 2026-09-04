import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app.js';

const endpoint = '/api/v1/suggestions';
const validBody = { occasion: 'birthday', relationship: 'friend' };

describe('security headers', () => {
  it('does not advertise the framework', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it.each([
    ['x-content-type-options', 'nosniff'],
    ['x-frame-options', 'SAMEORIGIN'],
    ['x-dns-prefetch-control', 'off'],
  ])('sets %s', async (header, value) => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.headers[header]).toBe(value);
  });

  it('sets HSTS', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.headers['strict-transport-security']).toMatch(/max-age=\d+/);
  });

  /** A weak body fingerprint that buys a JSON API nothing. */
  it('does not send an ETag', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.headers.etag).toBeUndefined();
  });

  /**
   * The one helmet default that had to be overridden. This API is called from
   * another origin by design; a `same-origin` resource policy would be a header
   * that contradicts the product it protects.
   */
  it('declares a cross-origin resource policy, because that is the product', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('applies the headers to error responses too', async () => {
    const response = await request(buildTestApp()).post(endpoint).send({});

    expect(response.status).toBe(400);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('request body limits', () => {
  it('rejects a body over 4kb with 413', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ ...validBody, pad: 'a'.repeat(8000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects malformed JSON with 400, never 5xx', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send('{"occasion": "birthday",}');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  /**
   * The 4kb cap is also the depth control: the deepest object that fits is
   * around 560 levels, which the parser handles. A separate depth rule would
   * be a rule that never fires.
   */
  it('survives the deepest nesting that fits inside the size limit', async () => {
    let deep: unknown = validBody;
    for (let i = 0; i < 300; i += 1) deep = { a: deep };

    const response = await request(buildTestApp())
      .post(endpoint)
      .send(deep as object);

    expect(response.status).toBe(400);
    expect(response.status).toBeLessThan(500);
  });

  it('rejects deeper nesting on size, still without a 5xx', async () => {
    let deep: unknown = validBody;
    for (let i = 0; i < 1000; i += 1) deep = { a: deep };

    const response = await request(buildTestApp())
      .post(endpoint)
      .send(deep as object);

    expect(response.status).toBe(413);
  });
});

describe('content type', () => {
  /**
   * Without this guard `express.json()` silently skips the body and the caller
   * gets "occasion is required" for a request that did send `occasion` —
   * an answer that points at the wrong thing.
   */
  it('rejects a non-JSON body with 415 and says why', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .set('Content-Type', 'text/plain')
      .send(JSON.stringify(validBody));

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(response.body.error.message).toContain('application/json');
  });

  it('accepts application/json with a charset', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .set('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(validBody));

    expect(response.status).toBe(200);
  });

  it('still reports a missing body as a validation problem', async () => {
    const response = await request(buildTestApp()).post(endpoint).send();

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not interfere with GET', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.status).toBe(200);
  });
});

describe('method handling', () => {
  /**
   * 404 for a wrong verb tells the caller to check the URL, when the URL was
   * right. The contract had promised 405 since phase 02; the code had not
   * caught up.
   */
  it.each(['get', 'put', 'delete', 'patch'] as const)(
    'answers 405 for %s on an endpoint that exists',
    async (method) => {
      const response = await request(buildTestApp())[method](endpoint);

      expect(response.status).toBe(405);
      expect(response.body.error.code).toBe('METHOD_NOT_ALLOWED');
      expect(response.headers.allow).toBe('POST');
    },
  );

  it('still answers 404 for a path that does not exist', async () => {
    const response = await request(buildTestApp()).post('/api/v1/nope');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('error responses never leak internals', () => {
  it.each([
    ['unknown route', () => request(buildTestApp()).get('/api/v1/nope')],
    ['malformed body', () => request(buildTestApp()).post(endpoint).send({})],
    [
      'wrong media type',
      () => request(buildTestApp()).post(endpoint).set('Content-Type', 'text/plain').send('x'),
    ],
  ])('exposes no stack trace or path for %s', async (_label, send) => {
    const response = await send();
    const body = JSON.stringify(response.body);

    expect(body).not.toMatch(/\bat \w+ \(/);
    expect(body).not.toMatch(/\.ts:\d+|\.js:\d+/);
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('/Users/');
  });

  it('carries a requestId on every error, so a log line can be found', async () => {
    const response = await request(buildTestApp()).post(endpoint).send({});

    expect(response.body.meta.requestId).toMatch(/^req_/);
  });
});
