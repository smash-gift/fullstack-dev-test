import axios from 'axios';
import { geminiConfig } from '../config/env';

const fallbackSuggestions: Record<string, Record<string, string[]>> = {
  aniversario: {
    amigo: [
      'Feliz aniversário! Que seu dia seja incrível!',
      'Muita alegria e sucesso para você neste novo ano!',
    ],
    mae: [
      'Feliz aniversário, mãe! Você é minha inspiração.',
      'Que seu dia seja tão especial quanto você é para mim!',
    ],
  },
  casamento: {
    amigo: [
      'Parabéns pelo casamento! Que a felicidade seja constante.',
      'Desejo muito amor e cumplicidade nesta nova fase!',
    ],
  },
};

export async function getSuggestions(occasion: string, relationship: string): Promise<string[]> {
  try {
    const prompt = `Sugira 2 a 3 mensagens curtas (1 a 2 frases cada) para um cartão-presente de ocasião "${occasion}" para "${relationship}". Seja breve, amigável e não repita frases.`;
    const response = await axios.post(
      geminiConfig.url,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 7000,
      }
    );

    const candidates = response.data.candidates;
    if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta inesperada do Gemini');
    }

    const text = candidates[0].content.parts[0].text as string;
    const suggestions = text.split(/\n|\d+\.|•|\-/).map((entry) => entry.trim()).filter(Boolean);
    return suggestions.slice(0, 3);
  } catch (_error: any) {
    const lowerOccasion = occasion.toLowerCase();
    const lowerRelationship = relationship.toLowerCase();
    const fallback = fallbackSuggestions[lowerOccasion]?.[lowerRelationship] || [
      'Parabéns! Que este presente traga muita alegria.',
      'Desejo tudo de melhor para você nesta ocasião especial!',
    ];

    const error: any = new Error('LLM unavailable, using fallback');
    error.suggestions = fallback;
    throw error;
  }
}