import type { LlmProvider } from '../../domain/providers/llm-provider.js';
import type { Env } from '../../pkg/config/env.js';
import { GeminiProvider } from './gemini/gemini.provider.js';
import { OpenAiProvider } from './openai/openai.provider.js';
import { OpenRouterProvider } from './openrouter/openrouter.provider.js';
import { StubLlmProvider } from './stub/stub-llm.provider.js';

/**
 * Chooses the adapter from configuration.
 *
 * Adding a fourth provider means adding a file and one case here. No existing
 * code changes — which is the open/closed principle showing up as something
 * verifiable rather than as a slogan.
 *
 * Credentials are guaranteed present by the env schema, which requires the key
 * matching the selected provider. Failing there means the server never starts,
 * instead of failing on the first real request.
 */
export function createLlmProvider(env: Env): LlmProvider {
  const shared = {
    temperature: env.LLM_TEMPERATURE,
    maxOutputTokens: env.LLM_MAX_OUTPUT_TOKENS,
  };

  switch (env.LLM_PROVIDER) {
    case 'openai':
      return new OpenAiProvider({
        ...shared,
        apiKey: env.OPENAI_API_KEY as string,
        model: env.OPENAI_MODEL,
      });

    case 'openrouter':
      return new OpenRouterProvider({
        ...shared,
        apiKey: env.OPENROUTER_API_KEY as string,
        model: env.OPENROUTER_MODEL,
        appTitle: 'Gift Card Message Suggester',
      });

    case 'gemini':
      return new GeminiProvider({
        ...shared,
        apiKey: env.GEMINI_API_KEY as string,
        model: env.GEMINI_MODEL,
      });

    case 'stub':
      return new StubLlmProvider();
  }
}
