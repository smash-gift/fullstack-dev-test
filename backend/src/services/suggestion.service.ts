import { suggestionSchema } from "../schemas/suggestion.schema";
import { SuggestionResponse } from "../types/suggestion";
import { execute as executeFallback } from "./fallback.service";
import { execute as executeLlm } from "./llm.service";

export async function execute(input: unknown): Promise<SuggestionResponse> {
  const parsed = suggestionSchema.parse(input);

  try {
    return await executeLlm(parsed.occasion, parsed.relationship);
  } catch {
    return executeFallback(parsed.occasion);
  }
}