import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiConfig } from '../../config/env';
import type { SuggestionLLMProvider } from './suggestion-llm-provider';
import { GenerativeModelFactory, GenerativeModelLike } from './gemini-suggestion-provider.types';


function createGenerativeModel(modelName: string, apiVersion: string, apiKey: string): GenerativeModelLike {
  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({ model: modelName }, { apiVersion });
}

export class GeminiSuggestionProvider implements SuggestionLLMProvider {
  readonly name: string;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly apiVersion: string,
    private readonly modelFactory: GenerativeModelFactory = (name, version) =>
      createGenerativeModel(name, version, apiKey),
  ) {
    this.name = `${modelName}`;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = this.modelFactory(this.modelName, this.apiVersion);
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