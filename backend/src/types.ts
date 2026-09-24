import { z } from 'zod';

/**
 * Request contract for the suggestions endpoint.
 * `occasion` and `relationship` are both required.
 */
export const suggestionRequestSchema = z.object({
  occasion: z
    .string()
    .trim()
    .min(1, 'occasion is required')
    .max(60, 'occasion is too long'),
  relationship: z
    .string()
    .trim()
    .min(1, 'relationship is required')
    .max(60, 'relationship is too long'),
});

export type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;

/** Where the returned suggestions came from. */
export type SuggestionSource = 'llm' | 'fallback';

/** Successful response contract. */
export interface SuggestionResponse {
  suggestions: string[];
  source: SuggestionSource;
}

/**
 * Schema the LLM output is validated against (defence in depth on top of
 * structured output). We require 2–3 non-empty, reasonably short messages.
 */
export const llmOutputSchema = z.object({
  suggestions: z
    .array(z.string().trim().min(1).max(280))
    .min(2, 'expected at least 2 suggestions')
    .max(3, 'expected at most 3 suggestions'),
});

export type LlmOutput = z.infer<typeof llmOutputSchema>;

/** Contract every LLM provider must satisfy. Keeps the service decoupled. */
export interface LlmProvider {
  readonly name: string;
  generateSuggestions(input: SuggestionRequest): Promise<string[]>;
}
