import { z } from "zod";

export const suggestionSchema = z.object({
    occasion: z.string().min(2).max(50),
    relationship: z.string().trim().min(2).max(50),
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;