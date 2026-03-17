import { generateWithGemini } from "../providers/gemini.provider";

export interface SuggestionsResult {
  suggestions: string[];
  source: "ai" | "fallback";
}

const FALLBACK_SUGGESTIONS = [
  "Que este presente traga alegria e muitos sorrisos!",
  "Com carinho, pensando em você neste momento especial.",
  "Espero que goste deste presente feito com muito amor.",
];

export async function getSuggestions(
  occasion: string,
  relationship: string
): Promise<SuggestionsResult> {
  try {
    const suggestions = await generateWithGemini(occasion, relationship);
    return { suggestions, source: "ai" };
  } catch (error) {
    console.error("Gemini falhou, usando fallback:", error);
    return { suggestions: FALLBACK_SUGGESTIONS, source: "fallback" };
  }
}