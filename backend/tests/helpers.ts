import type { GeneratedSuggestions, LlmProvider, Logger } from '../src/domain/ports.js';
import type { SuggestionRequest } from '../src/domain/suggestion.js';

export function requestOf(overrides: Partial<SuggestionRequest> = {}): SuggestionRequest {
  return {
    occasion: 'birthday',
    relationship: 'friend',
    locale: 'en',
    count: 3,
    refresh: false,
    ...overrides,
  };
}

export const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

export class StubLlmProvider implements LlmProvider {
  readonly model = 'stub-model';
  readonly promptVersion = 'test';
  calls = 0;

  constructor(
    private readonly behaviour: (request: SuggestionRequest) => Promise<GeneratedSuggestions>,
    readonly isConfigured = true,
  ) {}

  generate(request: SuggestionRequest): Promise<GeneratedSuggestions> {
    this.calls += 1;
    return this.behaviour(request);
  }
}

export function succeedingProvider(texts = ['One.', 'Two.', 'Three.']): StubLlmProvider {
  return new StubLlmProvider(async () => ({
    suggestions: texts.map((text, index) => ({ id: `s${index + 1}`, text })),
    model: 'stub-model',
    promptVersion: 'test',
  }));
}

export function failingProvider(error: Error): StubLlmProvider {
  return new StubLlmProvider(async () => {
    throw error;
  });
}
