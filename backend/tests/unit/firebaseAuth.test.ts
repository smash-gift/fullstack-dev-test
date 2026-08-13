const mockVerifyIdToken = jest.fn();

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(() => ({})),
  credential: { cert: jest.fn(() => ({})) },
  auth: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

import type { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../../src/middleware/firebaseAuth';

function makeReq(authorization?: string): Request {
  return { headers: authorization ? { authorization } : {} } as unknown as Request;
}

describe('verifyFirebaseToken', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  it('calls next with a 401 AppError when the Authorization header is missing', async () => {
    const req = makeReq();
    const res = {} as Response;
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('calls next with a 401 AppError when the header has no Bearer scheme', async () => {
    const req = makeReq('Token abc123');
    const res = {} as Response;
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next as unknown as NextFunction);

    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('sets req.user and calls next() when the token is valid', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-123', email: 'a@b.com' });
    const req = makeReq('Bearer valid-token');
    const res = {} as Response;
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next as unknown as NextFunction);

    expect(req.user).toEqual({ uid: 'user-123', email: 'a@b.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with a 401 AppError when verifyIdToken rejects', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('expired token'));
    const req = makeReq('Bearer expired-token');
    const res = {} as Response;
    const next = jest.fn();

    await verifyFirebaseToken(req, res, next as unknown as NextFunction);

    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });
});
