import type { SuggestMessagesInput } from '../../../domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../../domain/entities/suggestion.js';
import { LlmInvalidResponseError } from '../../../domain/errors/index.js';
import type { LlmProvider } from '../../../domain/providers/llm-provider.js';
import { postJson } from '../http/llm-http.js';
import { parseSuggestionsPayload } from '../parsing/llm-response.schema.js';
import {
  buildSuggestionUserMessage,
  SUGGESTION_SYSTEM_PROMPT,
} from '../prompt/suggestion-prompt.js';

export interface OpenRouterProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly temperature: number;
  readonly maxOutputTokens: number;
  readonly appUrl?: string;
  readonly appTitle?: string;
  readonly baseUrl?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/**
 * OpenRouter adapter — a gateway exposing many models behind one
 * OpenAI-compatible API.
 *
 * Not the default: the brief says "OpenAI or Google AI", and a gateway is
 * neither. It exists because switching models becomes an environment
 * variable, and because three adapters honouring one port is what proves the
 * abstraction is real rather than asserted.
 * See docs/01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md
 *
 * Requests `json_object` rather than `json_schema`: the model here is
 * user-selected, and schema-constrained decoding is not supported by every
 * model in the catalogue. Validation downstream is what actually guarantees
 * the shape.
 */
export class OpenRouterProvider implements LlmProvider {
  readonly name = 'openrouter';
  readonly model: string;

  private readonly options: OpenRouterProviderOptions;

  constructor(options: OpenRouterProviderOptions) {
    this.options = options;
    this.model = options.model;
  }

  async generateSuggestions(
    input: SuggestMessagesInput,
    signal: AbortSignal,
  ): Promise<Suggestion[]> {
    const payload = (await postJson({
      url: `${this.options.baseUrl ?? 'https://openrouter.ai/api/v1'}/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        // Optional attribution headers used by OpenRouter's dashboard.
        ...(this.options.appUrl ? { 'HTTP-Referer': this.options.appUrl } : {}),
        ...(this.options.appTitle ? { 'X-Title': this.options.appTitle } : {}),
      },
      signal,
      providerName: this.name,
      body: {
        model: this.model,
        temperature: this.options.temperature,
        max_tokens: this.options.maxOutputTokens,
        messages: [
          { role: 'system', content: SUGGESTION_SYSTEM_PROMPT },
          { role: 'user', content: buildSuggestionUserMessage(input) },
        ],
        response_format: { type: 'json_object' },
      },
    })) as ChatCompletionResponse;

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new LlmInvalidResponseError('OpenRouter returned an empty completion');
    }

    return parseSuggestionsPayload(content, input.count);
  }
}
