import { z } from 'zod';

/**
 * Input validation. Runs before any LLM/fallback logic so malformed requests
 * fail fast with a clear 400 — distinct from the "LLM failed" path, which
 * always succeeds with a fallback.
 */
export const suggestionSchema = z.object({
  occasion: z.string().trim().min(1, 'occasion is required').max(80),
  relationship: z.string().trim().min(1, 'relationship is required').max(80),
  tone: z.string().trim().max(40).optional(),
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;
