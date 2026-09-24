import { Type, type Schema } from '@google/genai';
import type { SuggestionRequest } from '../types.js';

/**
 * System instruction constrains the model to produce ONLY gift-card message
 * suggestions, in English, as strict JSON. Combined with the provider's
 * structured-output config this keeps parsing robust.
 */
export const SYSTEM_INSTRUCTION = [
  'You are a helpful assistant that writes short, warm messages to be printed',
  'on gift cards. Always answer in English. Produce concise, sincere messages',
  'of one to two sentences each, appropriate for the given occasion and',
  'relationship. Avoid names, avoid emojis, avoid quotation marks around the',
  'messages, and never include any commentary outside the requested JSON.',
].join(' ');

/**
 * Builds the user-facing prompt. Kept deliberately small: fewer tokens = lower
 * cost and latency, which matters for a high-volume, low-margin feature.
 */
export function buildPrompt(input: SuggestionRequest): string {
  return [
    `Write 2 to 3 distinct gift card messages for the occasion`,
    `"${input.occasion}" addressed to my ${input.relationship}.`,
    `Each message must be 1 to 2 short sentences.`,
  ].join(' ');
}

/** JSON schema handed to the model so it returns structured output. */
export const RESPONSE_JSON_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      minItems: '2',
      maxItems: '3',
      items: { type: Type.STRING },
    },
  },
  required: ['suggestions'],
};
