import { fallbackSuggestions } from './fallback.js';
import type { LlmClient, SuggestionInput, SuggestionResponse, SuggestionService } from './types.js';

export function createSuggestionService(
  llmClient: LlmClient | undefined,
  logger: Pick<Console, 'warn'> = console,
): SuggestionService {
  return {
    async suggest(input: SuggestionInput): Promise<SuggestionResponse> {
      if (!llmClient) {
        return {
          suggestions: fallbackSuggestions(input),
          source: 'fallback',
          fallback: true,
        };
      }

      try {
        const suggestions = await llmClient.generateSuggestions(input);
        return { suggestions, source: 'llm', fallback: false };
      } catch (error) {
        logger.warn({
          event: 'llm_request_failed',
          error: error instanceof Error ? error.name : 'unknown',
        });

        return {
          suggestions: fallbackSuggestions(input),
          source: 'fallback',
          fallback: true,
        };
      }
    },
  };
}
