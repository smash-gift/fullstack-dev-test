import type { SuggestMessagesInput } from '../dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../entities/suggestion.js';

/**
 * The only thing the domain knows about language models.
 *
 * Three deliberate properties of this contract:
 *
 * 1. It takes an `AbortSignal`. The timeout is imposed by the caller, so an
 *    adapter cannot forget to honour it.
 * 2. It returns `Suggestion[]`, not raw text. Parsing and validating model
 *    output is the adapter's job — the use case never sees LLM JSON.
 * 3. It throws domain errors (`LlmError` subclasses), never SDK errors. The
 *    use case does not know what an OpenAI `APIError` is, and should not.
 *
 * See docs/01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md
 */
export interface LlmProvider {
  /** Provider identifier, e.g. `openai`. Used in logs and health output. */
  readonly name: string;

  /** Model identifier, e.g. `gpt-4o-mini`. Reported to the client on success. */
  readonly model: string;

  generateSuggestions(input: SuggestMessagesInput, signal: AbortSignal): Promise<Suggestion[]>;
}
