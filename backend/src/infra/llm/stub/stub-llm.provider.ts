import type { SuggestMessagesInput } from '../../../domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../../domain/entities/suggestion.js';
import type { LlmProvider } from '../../../domain/providers/llm-provider.js';
import { createId } from '../../../pkg/utils/id.js';

/**
 * Deterministic provider used while the real adapters are being built, and as
 * a default that lets the server boot with no credentials at all.
 *
 * It exercises the whole HTTP path — validation, controller, response shape,
 * caching — without network, cost, or an API key.
 */
export class StubLlmProvider implements LlmProvider {
  readonly name = 'stub';
  readonly model = 'stub-deterministic-v1';

  async generateSuggestions(
    input: SuggestMessagesInput,
    signal: AbortSignal,
  ): Promise<Suggestion[]> {
    signal.throwIfAborted();

    const templates = [
      `Wishing you a wonderful ${input.occasion}. You mean a lot to me.`,
      `Happy ${input.occasion}! Thank you for being such a great ${input.relationship}.`,
      `Here's to your ${input.occasion}, and to many more moments together.`,
    ];

    return templates.slice(0, input.count).map((text) => ({ id: createId('sug'), text }));
  }
}
