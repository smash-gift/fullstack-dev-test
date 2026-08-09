import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SuggestionService } from '../src/domain/suggestionService';
import { FallbackProvider } from '../src/fallback/fallbackProvider';
import { createHandler } from '../src/http/handler';
import { FakeCache, FakeLlm, FakeLogger, FakeRateLimiter } from './support/doubles';
import { FakeResponse, request } from './support/http';

const VALID_OUTPUT = [
  'Happy birthday! Hope your day is a great one.',
  'Wishing you a wonderful year ahead.',
  'Have the best birthday yet.',
];

function build(llm: FakeLlm = FakeLlm.failingWith(new Error('provider down'))) {
  const logger = new FakeLogger();
  const rateLimiter = new FakeRateLimiter();
  const service = new SuggestionService({
    llm,
    cache: new FakeCache(),
    fallback: new FallbackProvider(),
    logger,
  });

  return {
    handler: createHandler({ service, rateLimiter, logger, allowedOrigins: ['*'] }),
    rateLimiter,
    logger,
  };
}

describe('suggestions handler', () => {
  it('answers 200 with fallback suggestions when the model is unavailable', async () => {
    const { handler } = build();
    const res = new FakeResponse();

    await handler(request(), res);

    assert.equal(res.statusCode, 200);
    const body = res.body as { suggestions: string[]; source: string };
    assert.equal(body.source, 'fallback');
    assert.equal(body.suggestions.length, 3);
  });

  it('answers 200 with model output when the model works', async () => {
    const { handler } = build(FakeLlm.respondingWith(VALID_OUTPUT));
    const res = new FakeResponse();

    await handler(request(), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { suggestions: VALID_OUTPUT, source: 'llm' });
  });

  it('answers the CORS preflight without running the request', async () => {
    const { handler } = build();
    const res = new FakeResponse();

    await handler(request({ method: 'OPTIONS' }), res);

    assert.equal(res.statusCode, 204);
    assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
    assert.match(res.headers['Access-Control-Allow-Headers'] ?? '', /Authorization/);
  });

  it('echoes an allowed origin and marks the response as origin-dependent', async () => {
    const logger = new FakeLogger();
    const service = new SuggestionService({
      llm: FakeLlm.respondingWith(VALID_OUTPUT),
      cache: new FakeCache(),
      fallback: new FallbackProvider(),
      logger,
    });
    const handler = createHandler({
      service,
      rateLimiter: new FakeRateLimiter(),
      logger,
      allowedOrigins: ['http://localhost:8080'],
    });
    const res = new FakeResponse();

    await handler(request({ headers: { origin: 'http://localhost:8080' } }), res);

    assert.equal(res.headers['Access-Control-Allow-Origin'], 'http://localhost:8080');
    assert.equal(res.headers['Vary'], 'Origin');
  });

  it('omits the allow-origin header for an origin outside the allowlist', async () => {
    const logger = new FakeLogger();
    const service = new SuggestionService({
      llm: FakeLlm.respondingWith(VALID_OUTPUT),
      cache: new FakeCache(),
      fallback: new FallbackProvider(),
      logger,
    });
    const handler = createHandler({
      service,
      rateLimiter: new FakeRateLimiter(),
      logger,
      allowedOrigins: ['http://localhost:8080'],
    });
    const res = new FakeResponse();

    await handler(request({ headers: { origin: 'http://evil.example' } }), res);

    // The browser refuses to hand the body to a page whose origin is not named.
    assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
  });

  it('rejects methods other than POST', async () => {
    const { handler } = build();
    const res = new FakeResponse();

    await handler(request({ method: 'GET' }), res);

    assert.equal(res.statusCode, 405);
    assert.deepEqual(res.body, {
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST to request suggestions.' },
    });
  });

  it('answers 400 for an invalid body', async () => {
    const { handler } = build();
    const res = new FakeResponse();

    await handler(request({ body: { occasion: '', relationship: 'Friend' } }), res);

    assert.equal(res.statusCode, 400);
    const body = res.body as { error: { code: string } };
    assert.equal(body.error.code, 'INVALID_INPUT');
  });

  it('parses a JSON body that arrived as a raw string', async () => {
    const { handler } = build();
    const res = new FakeResponse();

    await handler(
      request({ body: JSON.stringify({ occasion: 'Wedding', relationship: 'Colleague' }) }),
      res,
    );

    assert.equal(res.statusCode, 200);
  });

  it('never leaks internals when something unexpected breaks', async () => {
    const { logger } = build();
    const brokenService = {
      suggest: async () => {
        throw new Error('secret detail: sk-should-never-surface');
      },
    } as unknown as SuggestionService;
    const handler = createHandler({
      service: brokenService,
      rateLimiter: new FakeRateLimiter(),
      logger,
      allowedOrigins: ['*'],
    });
    const res = new FakeResponse();

    await handler(request(), res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
    });
    assert.ok(!JSON.stringify(res.body).includes('sk-'));
    assert.ok(logger.has('unhandled_request_failure'));
  });

  // Test 7 — the limit, as the client experiences it.
  it('answers 429 with Retry-After once the limit is reached', async () => {
    const { handler, rateLimiter } = build();
    rateLimiter.allowed = false;
    rateLimiter.retryAfterSeconds = 42;
    const res = new FakeResponse();

    await handler(request(), res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.headers['Retry-After'], '42');
    assert.deepEqual(res.body, {
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' },
    });
  });

  it('checks the limit before validating, so malformed floods still count', async () => {
    const { handler, rateLimiter } = build();
    rateLimiter.allowed = false;
    rateLimiter.retryAfterSeconds = 5;
    const res = new FakeResponse();

    await handler(request({ body: { occasion: '', relationship: '' } }), res);

    assert.equal(res.statusCode, 429, 'not 400');
  });

  it('counts against the caller address', async () => {
    const { handler, rateLimiter } = build();

    await handler(request({ ip: '203.0.113.7' }), new FakeResponse());

    assert.deepEqual(rateLimiter.keys, ['203.0.113.7']);
  });

  it('keeps serving when the limiter itself is unavailable', async () => {
    const { handler, rateLimiter, logger } = build(FakeLlm.respondingWith(VALID_OUTPUT));
    rateLimiter.failWith = new Error('firestore unreachable');
    const res = new FakeResponse();

    await handler(request(), res);

    assert.equal(res.statusCode, 200, 'a broken counter must not take the service down');
    assert.ok(logger.has('rate_limit_unavailable'));
  });

  it('returns a request id the client can quote when reporting a problem', async () => {
    const { handler } = build();
    const res = new FakeResponse();

    await handler(request(), res);

    assert.match(res.headers['X-Request-Id'] ?? '', /^[0-9a-f-]{36}$/);
  });
});
