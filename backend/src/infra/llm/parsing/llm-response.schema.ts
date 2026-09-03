import { z } from 'zod';

import {
  MAX_SUGGESTION_COUNT,
  MIN_SUGGESTION_COUNT,
} from '../../../domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../../domain/entities/suggestion.js';
import { LlmInvalidResponseError } from '../../../domain/errors/index.js';
import { createId } from '../../../pkg/utils/id.js';

/** A gift card message of 1-2 sentences does not need more room than this. */
export const MAX_SUGGESTION_LENGTH = 240;

const payloadSchema = z.object({
  suggestions: z
    .array(z.string().trim().min(1).max(MAX_SUGGESTION_LENGTH))
    .min(MIN_SUGGESTION_COUNT)
    .max(MAX_SUGGESTION_COUNT),
});

/**
 * Turns raw model text into domain entities, or fails.
 *
 * A 200 OK carrying unusable content is a failure, not a success. Treating
 * only transport errors as failures is how invalid data ends up flowing
 * onward and breaking three layers away from its cause — so the check happens
 * here, inside the adapter, where the context still exists.
 *
 * Structural validity only. The security guard deliberately does NOT run
 * here: it runs in the use case, on the one path every provider shares, so
 * that no adapter can bypass it by not calling this helper.
 *
 * Every rejection is an LlmInvalidResponseError, which the use case turns
 * into the fallback path.
 */
export function parseSuggestionsPayload(rawText: string, expectedCount: number): Suggestion[] {
  const parsedJson = parseJson(rawText);
  const result = payloadSchema.safeParse(parsedJson);

  if (!result.success) {
    throw new LlmInvalidResponseError(
      `LLM payload failed validation: ${result.error.issues.map((i) => i.message).join('; ')}`,
    );
  }

  const { suggestions } = result.data;

  if (suggestions.length !== expectedCount) {
    throw new LlmInvalidResponseError(
      `LLM returned ${suggestions.length} suggestions, expected ${expectedCount}`,
    );
  }

  return suggestions.map((text) => ({ id: createId('sug'), text }));
}

function parseJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    // Some models wrap JSON in a markdown fence despite being told not to.
    // One recovery attempt is worth it; anything beyond that is guessing.
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(rawText);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        throw new LlmInvalidResponseError('LLM response was not valid JSON');
      }
    }
    throw new LlmInvalidResponseError('LLM response was not valid JSON');
  }
}
