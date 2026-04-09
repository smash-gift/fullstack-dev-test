import { defaultSuggestionLLMProvider, type SuggestionLLMProvider } from './providers';

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

function getFallbackSuggestions(occasion: string, relationship: string): string[] {
  const lowerOccasion = occasion.toLowerCase();
  const lowerRelationship = relationship.toLowerCase();

  return fallbackSuggestions[lowerOccasion]?.[lowerRelationship] || [
    'Parabéns! Que este presente traga muita alegria.',
    'Desejo tudo de melhor para você nesta ocasião especial!',
  ];
}

function isIntroductoryLine(line: string): boolean {
  const normalized = line.trim().toLowerCase();

  return (
    /^(aqui est[aã]o|segue(m)?|op[cç][oõ]es|sugest[õo]es?|mensagens?)(\b|:)/i.test(normalized) ||
    (normalized.endsWith(':') && !/[.!?]$/.test(normalized))
  );
}

export function extractSuggestions(text: string): string[] {
  return text
    .replace(/\r/g, '\n')
    .split('\n')
    .flatMap((line) => line.split(/(?=\d+\.\s+|[•*-]\s+)/g))
    .map((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^[•*-]\s*/, '').trim())
    .filter((line) => line.length > 5)
    .filter((line) => !isIntroductoryLine(line))
    .slice(0, 3);
}

function buildSuggestionsPrompt(occasion: string, relationship: string): string {
  return `Sugira 2 a 3 mensagens curtas (1 a 2 frases cada) para um cartão-presente de ocasião "${occasion}" para "${relationship}". Seja breve, amigável e não repita frases. Retorne apenas as mensagens, uma por linha, sem título, sem numeração e sem texto introdutório.`;
}

export async function getSuggestions(
  occasion: string,
  relationship: string,
  provider: SuggestionLLMProvider = defaultSuggestionLLMProvider,
): Promise<string[]> {
  try {
    const prompt = buildSuggestionsPrompt(occasion, relationship);
    const text = await provider.generateText(prompt);

    if (!text) {
      throw new Error('Resposta vazia do Gemini');
    }

    const suggestions = extractSuggestions(text);

    if (suggestions.length === 0) {
      throw new Error('Não foi possível extrair sugestões válidas da resposta do Gemini');
    }

    return suggestions.slice(0, 3);
  } catch (caughtError: unknown) {
    console.error('=> LLM request failed:', {
      provider: provider.name,
      message: caughtError instanceof Error ? caughtError.message : String(caughtError),
      details: caughtError,
    });

    const fallback = getFallbackSuggestions(occasion, relationship);

    const error: any = new Error('LLM unavailable, using fallback');
    error.suggestions = fallback;
    throw error;
  }
}