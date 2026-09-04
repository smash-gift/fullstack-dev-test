import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';

import {
  contentTypeMiddleware,
  UnsupportedMediaTypeError,
} from '../../src/presentation/middlewares/content-type.middleware.js';

/**
 * Two of this middleware's decisions cannot be produced through supertest: its
 * client always attaches a `Content-Type`, and Node writes `Transfer-Encoding`
 * itself. Both are ordinary for a real caller — `curl --data-binary` without a
 * header, any streamed upload — so they are driven directly here rather than
 * left to a branch nobody exercises.
 */
function run(headers: Record<string, string | undefined>, method = 'POST') {
  const middleware = contentTypeMiddleware();
  const req = {
    method,
    headers,
    is: (type: string) => {
      const received = headers['content-type'];
      return received !== undefined && received.includes(type.replace('application/', ''))
        ? type
        : false;
    },
  } as unknown as Request;

  let passed: unknown = 'not called';
  const next: NextFunction = (error?: unknown) => {
    passed = error ?? null;
  };

  middleware(req, {} as Response, next);
  return passed;
}

describe('a body with no Content-Type at all', () => {
  it('is rejected, asking for the header rather than naming a value', () => {
    const outcome = run({ 'content-length': '42' });

    expect(outcome).toBeInstanceOf(UnsupportedMediaTypeError);
    expect((outcome as Error).message).toContain('required');
    expect((outcome as Error).message).not.toContain('undefined');
  });

  it('names the value when there is one to name', () => {
    const outcome = run({ 'content-length': '42', 'content-type': 'text/plain' });

    expect(outcome).toBeInstanceOf(UnsupportedMediaTypeError);
    expect((outcome as Error).message).toContain('text/plain');
  });
});

describe('a body whose length is not declared', () => {
  // A chunked request has no Content-Length. Reading that as "no body" would
  // wave the payload through to the schema, which then reports a missing field
  // for a request that carries it.
  it('is still checked, on the transfer encoding alone', () => {
    const outcome = run({ 'transfer-encoding': 'chunked', 'content-type': 'text/plain' });

    expect(outcome).toBeInstanceOf(UnsupportedMediaTypeError);
  });

  it('passes when it is chunked and does say JSON', () => {
    const outcome = run({ 'transfer-encoding': 'chunked', 'content-type': 'application/json' });

    expect(outcome).toBeNull();
  });
});

describe('requests this middleware has no opinion about', () => {
  it('lets a POST with no body through, for the schema to answer', () => {
    expect(run({ 'content-length': '0' })).toBeNull();
  });

  it('lets a GET through whatever its headers say', () => {
    expect(run({ 'content-length': '42', 'content-type': 'text/plain' }, 'GET')).toBeNull();
  });
});
