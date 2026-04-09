export interface AIResponse {
  result: string[];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  model: string;
}

export abstract class AIAdapter {
  protected apiKey: string;
  protected modelName: string;

  constructor(apiKey: string, modelName: string) {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  abstract suggestMessage(prompt: string): Promise<AIResponse>;
}
