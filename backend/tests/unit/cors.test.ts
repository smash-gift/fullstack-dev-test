import type { Request, Response, NextFunction } from 'express';
import createCorsMiddleware from '../../src/middleware/cors';

function makeReqRes(method: string): { req: Request; res: Response; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  const req = { method } as unknown as Request;
  const res = {
    setHeader: jest.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    status: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res, headers };
}

describe('createCorsMiddleware', () => {
  const ORIGIN = 'http://localhost:3000';

  it('sets Access-Control-Allow-Origin to the configured origin for a normal request', () => {
    const cors = createCorsMiddleware({ origin: ORIGIN });
    const { req, res, headers } = makeReqRes('POST');
    const next = jest.fn();

    cors(req, res, next as unknown as NextFunction);

    expect(headers['Access-Control-Allow-Origin']).toBe(ORIGIN);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets Access-Control-Allow-Methods and Access-Control-Allow-Headers', () => {
    const cors = createCorsMiddleware({ origin: ORIGIN });
    const { req, res } = makeReqRes('POST');
    const headers: Record<string, string> = {};
    (res.setHeader as jest.Mock).mockImplementation((name: string, value: string) => {
      headers[name] = value;
    });
    const next = jest.fn();

    cors(req, res, next as unknown as NextFunction);

    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
  });

  it('responds 204 and does not call next() for an OPTIONS preflight request', () => {
    const cors = createCorsMiddleware({ origin: ORIGIN });
    const { req, res } = makeReqRes('OPTIONS');
    const next = jest.fn();

    cors(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() (does not short-circuit) for non-OPTIONS requests', () => {
    const cors = createCorsMiddleware({ origin: ORIGIN });
    const { req, res } = makeReqRes('GET');
    const next = jest.fn();

    cors(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
