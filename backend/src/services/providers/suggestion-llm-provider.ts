export interface SuggestionLLMProvider {
  name: string;
  generateText(prompt: string): Promise<string>;
}