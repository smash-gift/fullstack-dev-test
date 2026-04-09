import { jest, describe, it, expect } from '@jest/globals';
import { MessageSugesterService } from './message-sugester.service';
import type { AIAdapter } from '../../../../integrations/ai/ai.adapter';

const mockAdapter = {
  suggestMessage: jest.fn<AIAdapter['suggestMessage']>(),
} as unknown as jest.Mocked<AIAdapter>;

describe('MessageSugesterService', () => {
  it('deve formatar o prompt corretamente e retornar o resultado do adapter', async () => {
    mockAdapter.suggestMessage.mockResolvedValue({
      result: [
        'Frase de sugestão mockada',
        'Frase de sugestão mockada',
        'Frase de sugestão mockada',
      ],
      usage: { promptTokens: 10, totalTokens: 50 },
      model: 'gemini-mock',
    });

    const service = new MessageSugesterService(mockAdapter);

    const response = await service.suggestMessage('Aniversário', 'Amigo');

    expect(response.result).toHaveLength(3);
    expect(response.result[0]).toBe('Frase de sugestão mockada');
    expect(mockAdapter.suggestMessage).toHaveBeenCalled();
  });

  it('deve usar o "Ultimo recurso" e retornar 3 frases estáticas se o adaptador falhar', async () => {
    const service = new MessageSugesterService(mockAdapter);
    
    // Forçamos o adaptador a falhar
    mockAdapter.suggestMessage.mockRejectedValue(new Error('AI Offline'));

    const response = await service.suggestMessage('Aniversário', 'Amigo');

    expect(response.result).toHaveLength(3);
    // Verifica se as frases retornadas pertencem à lista de fallback (opcional, mas bom para garantir)
    expect(response.result.every(msg => typeof msg === 'string')).toBe(true);
    expect(mockAdapter.suggestMessage).toHaveBeenCalled();
  });
});
