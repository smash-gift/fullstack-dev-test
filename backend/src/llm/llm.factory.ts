import { config } from '../config/env';
import { LlmProvider } from './llm.provider';
import { MockLlmProvider } from './mock.provider';
import { OpenAiProvider } from './openai.provider';

/**
 * Returns the configured provider instance. Extending to Gemini is a matter of
 * adding a `GeminiProvider` and one `case` here — nothing else in the app knows
 * which vendor is in use.
 */
export function createLlmProvider(): LlmProvider {
  switch (config.llm.provider) {
    case 'openai':
      return new OpenAiProvider();
    case 'mock':
      return new MockLlmProvider();
    // case 'gemini':
    //   return new GeminiProvider();
    default:
      return new OpenAiProvider();
  }
}
