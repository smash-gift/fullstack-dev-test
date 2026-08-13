import type { Request, Response, NextFunction } from 'express';
import createRateLimiter from '../../src/middleware/rateLimiter';

function makeReqRes(ip: string): { req: Request; res: Response } {
  const req = { ip } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

describe('rateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-12T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
    const { req, res } = makeReqRes('1.1.1.1');
    const next = jest.fn();

    limiter(req, res, next as unknown as NextFunction);
    limiter(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next.mock.calls[0]).toEqual([]);
    expect(next.mock.calls[1]).toEqual([]);
  });

  it('blocks requests over the limit with a 429 AppError', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
    const { req, res } = makeReqRes('1.1.1.1');
    const next = jest.fn();

    limiter(req, res, next as unknown as NextFunction);
    limiter(req, res, next as unknown as NextFunction);
    limiter(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(3);
    const thirdCallArg = next.mock.calls[2][0];
    expect(thirdCallArg).toMatchObject({ status: 429, code: 'RATE_LIMITED' });
  });

  it('tracks different IPs independently', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
    const clientA = makeReqRes('1.1.1.1');
    const clientB = makeReqRes('2.2.2.2');
    const nextA = jest.fn();
    const nextB = jest.fn();

    limiter(clientA.req, clientA.res, nextA as unknown as NextFunction);
    limiter(clientB.req, clientB.res, nextB as unknown as NextFunction);

    expect(nextA).toHaveBeenCalledWith();
    expect(nextB).toHaveBeenCalledWith();
  });

  it('resets the counter after the window elapses', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
    const { req, res } = makeReqRes('1.1.1.1');
    const next = jest.fn();

    limiter(req, res, next as unknown as NextFunction);
    jest.advanceTimersByTime(61000);
    limiter(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next.mock.calls[1]).toEqual([]);
  });
});
