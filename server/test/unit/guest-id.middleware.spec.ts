import { BadRequestException } from '@nestjs/common';
import { GuestIdMiddleware } from '../../src/common/middleware/guest-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('GuestIdMiddleware (RN02)', () => {
  let middleware: GuestIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new GuestIdMiddleware();
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('deve lançar BadRequestException quando o header X-Guest-ID está ausente', () => {
    mockRequest = { headers: {} };

    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).toThrow('Header X-Guest-ID is required (RN02).');
  });

  it('deve lançar BadRequestException quando X-Guest-ID não é UUID v4 válido', () => {
    mockRequest = { headers: { 'x-guest-id': 'not-a-uuid' } };

    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).toThrow('Header X-Guest-ID must be a valid UUID v4 (RN02).');
  });

  it('deve lançar BadRequestException quando X-Guest-ID é UUID v1 (não v4)', () => {
    // UUID v1 — tem "1" na posição de versão
    mockRequest = {
      headers: { 'x-guest-id': 'f47ac10b-58cc-1372-a567-0e02b2c3d479' },
    };

    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).toThrow(BadRequestException);
  });

  it('deve chamar next() com sucesso quando X-Guest-ID é UUID v4 válido (minúsculas)', () => {
    mockRequest = {
      headers: { 'x-guest-id': 'a1b2c3d4-e5f6-4789-a012-3456789abcde' },
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('deve aceitar UUID v4 em maiúsculas (case-insensitive)', () => {
    mockRequest = {
      headers: { 'x-guest-id': 'A1B2C3D4-E5F6-4789-A012-3456789ABCDE' },
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
