import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { LlmClient, SuggestionInput } from '../types.js';

const outputSchema = z.object({
  suggestions: z.array(z.string().trim().min(1).max(240)).min(2).max(3),
});

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    suggestions: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: { type: 'string' },
    },
  },
  required: ['suggestions'],
};

const systemPrompt = [
  'You write short, warm gift-card messages.',
  'Return exactly 2 or 3 distinct suggestions.',
  'Each suggestion must be one or two sentences and no more than 240 characters.',
  'Use the same language as the user input.',
  'Do not include quotation marks, headings, emojis, or explanations outside the JSON response.',
].join(' ');

export class GeminiClient implements LlmClient {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateSuggestions(input: SuggestionInput): Promise<string[]> {
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: JSON.stringify({
          occasion: input.occasion,
          relationship: input.relationship,
        }),
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema,
          maxOutputTokens: 300,
          abortSignal: abortController.signal,
        },
      });

      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error('Gemini returned an empty response');
      }

      return outputSchema.parse(JSON.parse(responseText)).suggestions;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}

export function createGeminiClient(options: {
  apiKey?: string;
  model: string;
  timeoutMs: number;
}): GeminiClient | undefined {
  if (!options.apiKey) {
    return undefined;
  }

  return new GeminiClient(options.apiKey, options.model, options.timeoutMs);
}
