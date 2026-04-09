import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { MessagerSugesterController } from './message-sugester.controller';
import { type MessageSugesterService } from '../services/message-sugester.service';

// Criamos um mock tipado para o serviço
const mockService = {
  suggestMessage: jest.fn<MessageSugesterService['suggestMessage']>(),
} as unknown as jest.Mocked<MessageSugesterService>;

describe('MessagerSugesterController', () => {
  let controller: MessagerSugesterController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    controller = new MessagerSugesterController(mockService);
    req = {
      body: {
        occasion: 'Aniversário',
        relationship: 'Amigo',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    next = jest.fn() as any;
    jest.clearAllMocks();
  });

  it('deve retornar 200 e o resultado sugerido pelo serviço', async () => {
    const mockResult = { result: ['Frase 1', 'Frase 2'] };
    mockService.suggestMessage.mockResolvedValue(mockResult);

    await controller.suggestMessage(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(mockService.suggestMessage).toHaveBeenCalledWith('Aniversário', 'Amigo');
  });

  it('deve chamar o next(error) em caso de falha no serviço', async () => {
    const mockError = new Error('Erro na IA');
    mockService.suggestMessage.mockRejectedValue(mockError);

    await controller.suggestMessage(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
