import { z } from 'zod';

const userText = z
  .string()
  .trim()
  .min(2, 'must have at least 2 characters')
  .max(80, 'must have at most 80 characters')
  .refine(
    (value) => !/[\\u0000-\\u001F\\u007F]/.test(value),
    'contains unsupported control characters',
  );

export const suggestionInputSchema = z
  .object({
    occasion: userText,
    relationship: userText,
  })
  .strict();

export type ValidatedSuggestionInput = z.infer<typeof suggestionInputSchema>;
