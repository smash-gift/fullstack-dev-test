
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
      GEMINI_URL,
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
    // Extrai sugestões do texto retornado
    const candidates = response.data.candidates;
    if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta inesperada do Gemini');
    }
    const text = candidates[0].content.parts[0].text as string;
    const suggestions = text.split(/\n|\d+\.|•|\-/).map(s => s.trim()).filter(Boolean);
    return suggestions.slice(0, 3);
  } catch (error: any) {
    // Fallback: retorna sugestões pré-definidas
    const lowerOccasion = occasion.toLowerCase();
    const lowerRelationship = relationship.toLowerCase();
    const fallback =
      fallbackSuggestions[lowerOccasion]?.[lowerRelationship] ||
      [
        'Parabéns! Que este presente traga muita alegria.',
        'Desejo tudo de melhor para você nesta ocasião especial!',
      ];
    // Lança erro especial para o controller saber que é fallback
    const err: any = new Error('LLM unavailable, using fallback');
    err.suggestions = fallback;
    throw err;
  }
}
