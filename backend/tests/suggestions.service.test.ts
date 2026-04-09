import { describe, expect, it } from '@jest/globals';
import { extractSuggestions, getSuggestions } from '../src/services/suggestions.service';
import type { SuggestionLLMProvider } from '../src/services/providers';

describe('extractSuggestions', () => {
  it('deve ignorar texto introdutório e retornar apenas as mensagens', () => {
    const text = `Aqui estão 3 opções curtas e amigáveis:

1. Parabéns, irmã! Mal posso esperar para descobrir essa novidade tão especial. Que venha com muita saúde!
2. Que alegria ver sua família crescendo! Muita saúde e amor para essa nova fase de vocês.
3. Amamos muito você e já estamos morrendo de amores pelo(a) sobrinho(a) que está a caminho!`;

    expect(extractSuggestions(text)).toEqual([
      'Parabéns, irmã! Mal posso esperar para descobrir essa novidade tão especial. Que venha com muita saúde!',
      'Que alegria ver sua família crescendo! Muita saúde e amor para essa nova fase de vocês.',
      'Amamos muito você e já estamos morrendo de amores pelo(a) sobrinho(a) que está a caminho!',
    ]);
  });

  it('deve aceitar respostas já formatadas uma por linha', () => {
    const text = `Feliz aniversário! Que seu dia seja incrível!
Muita alegria e sucesso para você neste novo ano!
Que esta data especial seja cheia de carinho e boas surpresas!`;

    expect(extractSuggestions(text)).toEqual([
      'Feliz aniversário! Que seu dia seja incrível!',
      'Muita alegria e sucesso para você neste novo ano!',
      'Que esta data especial seja cheia de carinho e boas surpresas!',
    ]);
  });

  it('deve usar o provedor injetado sem depender do SDK do Gemini', async () => {
    const fakeProvider: SuggestionLLMProvider = {
      name: 'fake-provider',
      generateText: async () => `Aqui estão as sugestões:
1. Mensagem um para a ocasião.
2. Mensagem dois para a ocasião.
3. Mensagem três para a ocasião.`,
    };

    await expect(getSuggestions('aniversario', 'amigo', fakeProvider)).resolves.toEqual([
      'Mensagem um para a ocasião.',
      'Mensagem dois para a ocasião.',
      'Mensagem três para a ocasião.',
    ]);
  });

  it('deve manter o fallback quando o provedor falhar', async () => {
    const failingProvider: SuggestionLLMProvider = {
      name: 'failing-provider',
      generateText: async () => {
        throw new Error('Provider unavailable');
      },
    };

    await expect(getSuggestions('aniversario', 'amigo', failingProvider)).rejects.toMatchObject({
      message: 'LLM unavailable, using fallback',
      suggestions: [
        'Feliz aniversário! Que seu dia seja incrível!',
        'Muita alegria e sucesso para você neste novo ano!',
      ],
    });
  });
});