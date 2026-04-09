import { describe, expect, it, jest } from '@jest/globals';
import { GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { GeminiSuggestionProvider } from '../src/services/providers';

describe('GeminiSuggestionProvider', () => {
  it('deve retornar o texto gerado pelo modelo', async () => {
    const provider = new GeminiSuggestionProvider(
      'fake-key',
      'gemini-2.5-flash',
      'v1',
      () => ({
        generateContent: async () => {
          return {
            response: Promise.resolve({
              text: () => 'Mensagem 1\nMensagem 2\nMensagem 3',
            }),
          };
        },
      }),
    );

    await expect(provider.generateText('prompt de teste')).resolves.toBe(
      'Mensagem 1\nMensagem 2\nMensagem 3',
    );
  });

  it('deve propagar o erro do provider sem nova tentativa', async () => {
    const generateContent = jest.fn(async () => {
      throw new GoogleGenerativeAIFetchError('temporarily unavailable', 503, 'Service Unavailable');
    });

    const provider = new GeminiSuggestionProvider(
      'fake-key',
      'gemini-2.5-flash',
      'v1',
      () => ({ generateContent }),
    );

    await expect(provider.generateText('prompt de teste')).rejects.toMatchObject({ status: 503 });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});