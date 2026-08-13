import type { Request, Response, NextFunction } from 'express';
import errorHandler from '../../src/middleware/errorHandler';
import AppError from '../../src/errors/AppError';

function makeReqRes(): { req: Request; res: Response } {
  const req = {} as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

describe('errorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('logs an AppError with status >= 500 (server/upstream error)', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const err = new AppError({
      status: 502,
      code: 'OPENAI_UPSTREAM_ERROR',
      message: 'Failed to reach OpenAI to generate messages.',
      cause: new Error('Request failed with status code 401'),
    });

    errorHandler(err, req, res, next as unknown as NextFunction);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'OPENAI_UPSTREAM_ERROR', message: 'Failed to reach OpenAI to generate messages.' },
    });
  });

  it('includes the cause message when logging an AppError with status >= 500', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const cause = new Error('Incorrect API key provided');
    const err = new AppError({
      status: 502,
      code: 'OPENAI_UPSTREAM_ERROR',
      message: 'Failed to reach OpenAI to generate messages.',
      cause,
    });

    errorHandler(err, req, res, next as unknown as NextFunction);

    const loggedArgs: unknown[] = consoleErrorSpy.mock.calls[0];
    const loggedText = loggedArgs.map((arg) => JSON.stringify(arg)).join(' ');
    expect(loggedText).toContain('Incorrect API key provided');
  });

  it('does not log sensitive fields (headers, config) from the cause object', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const cause = {
      message: 'Incorrect API key provided',
      status: 401,
      headers: { authorization: 'Bearer sk-super-secret-key' },
      config: { headers: { Authorization: 'Bearer sk-super-secret-key' } },
    };
    const err = new AppError({
      status: 502,
      code: 'OPENAI_UPSTREAM_ERROR',
      message: 'Failed to reach OpenAI to generate messages.',
      cause,
    });

    errorHandler(err, req, res, next as unknown as NextFunction);

    const loggedArgs: unknown[] = consoleErrorSpy.mock.calls[0];
    const loggedText = loggedArgs.map((arg) => JSON.stringify(arg)).join(' ');
    expect(loggedText).not.toContain('sk-super-secret-key');
  });

  it('does not log an AppError with status < 500 (expected client error)', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const err = new AppError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input.',
    });

    errorHandler(err, req, res, next as unknown as NextFunction);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('does not log a 429 rate-limit AppError', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const err = new AppError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests.',
    });

    errorHandler(err, req, res, next as unknown as NextFunction);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('returns 413 PAYLOAD_TOO_LARGE for a body-parser payload-too-large error, without logging it', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    // Shape thrown by the `raw-body` package (used internally by body-parser /
    // express.json) when the request body exceeds the configured `limit`.
    const err = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      type: 'entity.too.large',
      limit: 10240,
      length: 20000,
      expected: 10240,
    });

    errorHandler(err, req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: expect.any(String),
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('still logs unexpected non-AppError errors as before', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const err = new Error('boom');

    errorHandler(err, req, res, next as unknown as NextFunction);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
