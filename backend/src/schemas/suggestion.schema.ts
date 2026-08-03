import { z } from 'zod';

export const suggestionSchema = z.object({
  occasion: z
    .string({ required_error: 'occasion is required' })
    .min(1, 'occasion cannot be empty')
    .max(50, 'occasion is too long'),
  relationship: z
    .string({ required_error: 'relationship is required' })
    .min(1, 'relationship cannot be empty')
    .max(50, 'relationship is too long'),
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;
