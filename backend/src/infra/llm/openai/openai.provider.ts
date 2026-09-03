import type { SuggestMessagesInput } from '../../../domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../../domain/entities/suggestion.js';
import { LlmInvalidResponseError } from '../../../domain/errors/index.js';
import type { LlmProvider } from '../../../domain/providers/llm-provider.js';
import { postJson } from '../http/llm-http.js';
import { parseSuggestionsPayload } from '../parsing/llm-response.schema.js';
import {
  buildSuggestionUserMessage,
  SUGGESTIONS_JSON_SCHEMA,
  SUGGESTION_SYSTEM_PROMPT,
} from '../prompt/suggestion-prompt.js';

export interface OpenAiProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly temperature: number;
  readonly maxOutputTokens: number;
  readonly baseUrl?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/**
 * OpenAI Chat Completions adapter. The default provider: the brief asks for
 * "OpenAI or Google AI", and names gpt-4o-mini as a reasonable model.
 *
 * Uses Structured Outputs (`json_schema` with `strict: true`) so the model is
 * constrained at decoding time rather than merely asked politely for JSON.
 * The Zod check downstream still runs — structured output narrows the failure
 * modes, it does not remove the need to verify.
 */
export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  readonly model: string;

  private readonly options: OpenAiProviderOptions;

  constructor(options: OpenAiProviderOptions) {
    this.options = options;
    this.model = options.model;
  }

  async generateSuggestions(
    input: SuggestMessagesInput,
    signal: AbortSignal,
  ): Promise<Suggestion[]> {
    const payload = (await postJson({
      url: `${this.options.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`,
      headers: { Authorization: `Bearer ${this.options.apiKey}` },
      signal,
      providerName: this.name,
      body: {
        model: this.model,
        temperature: this.options.temperature,
        max_completion_tokens: this.options.maxOutputTokens,
        messages: [
          { role: 'system', content: SUGGESTION_SYSTEM_PROMPT },
          { role: 'user', content: buildSuggestionUserMessage(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'gift_card_suggestions',
            strict: true,
            schema: SUGGESTIONS_JSON_SCHEMA,
          },
        },
      },
    })) as ChatCompletionResponse;

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new LlmInvalidResponseError('OpenAI returned an empty completion');
    }

    return parseSuggestionsPayload(content, input.count);
  }
}
