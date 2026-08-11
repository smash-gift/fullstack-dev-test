export interface ILlmProvider {
  generateSuggestions(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<string[]>;
}

export const ILlmProviderToken = Symbol('ILlmProvider');
