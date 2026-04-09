import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiConfig } from '../../config/env';
import type { SuggestionLLMProvider } from './suggestion-llm-provider';

export class GeminiSuggestionProvider implements SuggestionLLMProvider {
  readonly name: string;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly apiVersion: string,
  ) {
    this.name = `${modelName}`;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.modelName }, { apiVersion: this.apiVersion });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  }
}

export const geminiSuggestionProvider = new GeminiSuggestionProvider(
  geminiConfig.apiKey,
  geminiConfig.model,
  geminiConfig.apiVersion,
);