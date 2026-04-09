import type { AIAdapter } from '../../../../integrations/ai/ai.adapter';
import { MESSAGE_PROMPT } from '../../../../integrations/ai/prompts/message-sugester';

export class MessageSugesterService {
  private adapter: AIAdapter;

  private readonly FALLBACK_MESSAGES = [
    "Espero que este momento seja repleto de alegria e inspiração para você.",
    "Que seu dia seja tão incrível quanto você é, aproveite cada segundo!",
    "Mantenha sempre esse sorriso no rosto e siga em frente com muita luz.",
    "Desejo que a felicidade te encontre em cada detalhe do seu caminho hoje.",
    "Lembre-se: o melhor ainda está por vir. Continue brilhando sempre!",
    "Que a paz e o sucesso te acompanhem em todos os seus novos projetos.",
    "Cada novo dia é uma oportunidade única de ser feliz, aproveite a sua!",
    "Sua dedicação é inspiradora. Que colha frutos maravilhosos em breve.",
    "Que este novo ciclo traga apenas coisas boas e momentos inesquecíveis.",
    "Você tem um potencial infinito, nunca duvide da sua capacidade de brilhar."
  ];

  constructor(adapter: AIAdapter) {
    this.adapter = adapter;
  }

  async suggestMessage(occasion: string, relationship: string): Promise<{ result: string[] }> {
    try {
      const fullPrompt = MESSAGE_PROMPT(occasion, relationship);
      const aiResponse = await this.adapter.suggestMessage(fullPrompt);

      console.info(`[MessageSugesterService] - usage`, aiResponse.usage);
      console.info(`[MessageSugesterService] - model`, aiResponse.model);

      return {
        result: aiResponse.result,
      };
    } catch (error) {
      console.error('[MessageSugesterService] - Ultimo recurso: AI integration failed, returning static phrases.', error);

      // Embaralha e seleciona 3 frases aleatórias
      const shuffled = [...this.FALLBACK_MESSAGES].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      return {
        result: selected,
      };
    }
  }
}
