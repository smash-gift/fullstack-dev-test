export interface LlmResult {
  suggestions: string[];
  providerName: string;
}

export interface ILlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateSuggestions(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<LlmResult>;
}

export const ILlmProviderToken = Symbol('ILlmProvider');
