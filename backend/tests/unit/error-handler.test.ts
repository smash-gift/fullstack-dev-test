import { Writable } from 'node:stream';

import express, { type Express, type RequestHandler } from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  DomainError,
  LlmTimeoutError,
  RateLimitedError,
  ValidationError,
} from '../../src/domain/errors/index.js';
import { createLogger, type Logger } from '../../src/pkg/logger/logger.js';
import { errorHandlerMiddleware } from '../../src/presentation/middlewares/error-handler.middleware.js';
import { requestIdMiddleware } from '../../src/presentation/middlewares/request-id.middleware.js';

/**
 * A minimal app whose only job is to throw.
 *
 * The routed suites reach this middleware through errors the system knows how
 * to produce. The branch that matters most is the opposite one — the error
 * nobody anticipated — and by definition no route produces it on purpose. So
 * one is thrown here on purpose.
 */
/**
 * The real logger writing to a stream we can read.
 *
 * The first version of these tests used a hand-made logger object, which
 * turned "the detail reaches the log" into "our fake recorded the object we
 * passed it" — and hid the question that matters: whether pino's own
 * serialisation actually writes an Error's message out. It does, and this is
 * how that is known rather than assumed.
 */
function capturingLogger(): { logger: Logger; lines: Record<string, unknown>[] } {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of String(chunk).split('\n').filter(Boolean)) lines.push(JSON.parse(line));
      callback();
    },
  });

  return { logger: createLogger({ level: 'debug', pretty: false, destination }), lines };
}

function appThrowing(handler: RequestHandler, logger: Logger = pino({ level: 'silent' })): Express {
  const app = express();
  app.use(requestIdMiddleware());
  app.get('/boom', handler);
  app.use(errorHandlerMiddleware(logger));
  return app;
}

describe('an error nobody anticipated', () => {
  /**
   * The brief's words: "the backend must not expose raw errors to the client".
   * Every other branch of this middleware handles an error we defined. This
   * one is the promise itself — and it had no test until phase 08 went looking
   * for coverage that was reassuring rather than proving.
   */
  it('answers 500 with a generic message, never the exception', async () => {
    const app = appThrowing(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'suggestions')");
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('An unexpected error occurred.');
  });

  it('exposes no stack trace, file path or dependency name', async () => {
    const app = appThrowing(() => {
      throw new Error('ENOENT: no such file /Users/someone/app/node_modules/pg/lib/client.js');
    });

    const body = JSON.stringify((await request(app).get('/boom')).body);

    expect(body).not.toContain('ENOENT');
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('/Users/');
    expect(body).not.toMatch(/\bat \w+ \(/);
  });

  it('keeps the detail in the log, where an operator can find it', async () => {
    const { logger, lines } = capturingLogger();
    const app = appThrowing(() => {
      throw new Error('the real reason');
    }, logger);

    const response = await request(app).get('/boom');
    const emitted = JSON.stringify(lines);

    expect(emitted).toContain('the real reason');
    expect(emitted).toContain('error-handler.test.ts');
    expect(lines[0]).toMatchObject({ requestId: response.body.meta.requestId });
  });

  /** A thrown non-Error must not become a second failure inside the handler. */
  it.each([
    ['a string', 'something went wrong'],
    ['a number', 42],
    ['an object', { unexpected: true }],
    [
      'an object with a poisoned toString',
      {
        toString: () => {
          throw new Error('nope');
        },
      },
    ],
  ])('survives %s being thrown', async (_label, thrown) => {
    const app = appThrowing(() => {
      throw thrown;
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });

  /**
   * `null` is the one thrown value that never arrives here: Express reads a
   * falsy error as "no error" and carries on routing, so the request ends at
   * its own 404. Recorded as a test because it is surprising, and because
   * someone will eventually wonder why the handler has no branch for it.
   */
  it('is not reached at all when null is thrown, which Express treats as no error', async () => {
    const app = appThrowing(() => {
      throw null;
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(404);
    expect(response.text).not.toMatch(/\bat \w+ \(/);
  });

  it('still carries a requestId, so the log line can be found', async () => {
    const app = appThrowing(() => {
      throw new Error('boom');
    });

    const response = await request(app).get('/boom');

    expect(response.body.meta.requestId).toMatch(/^req_/);
    expect(response.body.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

/**
 * Since phase 04 the use case degrades instead of throwing, so this branch is a
 * backstop. It is tested precisely because it is a backstop: the day something
 * bypasses the use case, this is what stands between an upstream message and
 * the client.
 */
describe('an LLM error that somehow escaped the use case', () => {
  it('answers a generic 500 rather than naming our vendor', async () => {
    const app = appThrowing(() => {
      throw new LlmTimeoutError(8000);
    });

    const response = await request(app).get('/boom');
    const body = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(body).not.toMatch(/openai|gemini|openrouter|timeout/i);
  });

  it('logs the provider-side reason it refuses to send', async () => {
    const { logger, lines } = capturingLogger();
    const app = appThrowing(() => {
      throw new LlmTimeoutError(8000);
    }, logger);

    await request(app).get('/boom');

    expect(lines[0]).toMatchObject({ code: 'LLM_TIMEOUT', reason: 'llm_timeout' });
  });
});

describe('errors the system defines keep their own shape', () => {
  it('maps a validation error to 400 with its issues', async () => {
    const app = appThrowing(() => {
      throw new ValidationError('Invalid request body', [
        { field: 'occasion', issue: 'occasion is required' },
      ]);
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'occasion', issue: 'occasion is required' },
    ]);
  });

  it('maps a rate limit error to 429 with Retry-After', async () => {
    const app = appThrowing(() => {
      throw new RateLimitedError(120);
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBe('120');
    expect(response.body.error.details).toEqual({ retryAfterSeconds: 120 });
  });

  /**
   * An unmapped domain code must not silently become a 200 or leak a stack —
   * 500 is the honest answer for a code nobody assigned a status to.
   */
  it('falls back to 500 for a domain error with no mapped status', async () => {
    class UnmappedError extends DomainError {
      readonly code = 'SOMETHING_NEW';
    }
    const app = appThrowing(() => {
      throw new UnmappedError('a code nobody mapped');
    });

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('SOMETHING_NEW');
  });
});
