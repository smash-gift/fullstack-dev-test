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

export interface GeminiProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly temperature: number;
  readonly maxOutputTokens: number;
  readonly baseUrl?: string;
}

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

/** Gemini expects the OpenAPI subset, with upper-case type names. */
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['suggestions'],
} as const;

/**
 * Google AI (Gemini) adapter.
 *
 * The credential travels in the `x-goog-api-key` header rather than as a
 * `?key=` query parameter: query strings end up in access logs, proxy logs and
 * browser history, and an API key does not belong in any of them.
 *
 * Uses `responseMimeType: application/json` with a `responseSchema`, which is
 * Gemini's equivalent of constrained decoding.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  readonly model: string;

  private readonly options: GeminiProviderOptions;

  constructor(options: GeminiProviderOptions) {
    this.options = options;
    this.model = options.model;
  }

  async generateSuggestions(
    input: SuggestMessagesInput,
    signal: AbortSignal,
  ): Promise<Suggestion[]> {
    const baseUrl = this.options.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';

    const payload = (await postJson({
      url: `${baseUrl}/models/${this.model}:generateContent`,
      headers: { 'x-goog-api-key': this.options.apiKey },
      signal,
      providerName: this.name,
      body: {
        systemInstruction: { parts: [{ text: SUGGESTION_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildSuggestionUserMessage(input) }] }],
        generationConfig: {
          temperature: this.options.temperature,
          maxOutputTokens: this.options.maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      },
    })) as GenerateContentResponse;

    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (typeof text !== 'string' || text.trim().length === 0) {
      // A safety block or a token limit lands here: the call succeeded, the
      // content did not. That is an invalid response, and it degrades.
      throw new LlmInvalidResponseError(
        `Gemini returned no usable content${candidate?.finishReason ? ` (finishReason: ${candidate.finishReason})` : ''}`,
      );
    }

    return parseSuggestionsPayload(text, input.count);
  }
}
