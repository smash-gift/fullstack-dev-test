import OpenAI from "openai";
import { SuggestionResponse } from "../types/suggestion";

export async function execute(
  occasion: string,
  relationship: string
): Promise<SuggestionResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const client = new OpenAI({ apiKey });

  const prompt = `
You are a helpful assistant that writes gift card messages.

Generate exactly 3 short gift card messages in English.

Context:
- Occasion: ${occasion}
- Relationship: ${relationship}

Rules:
- Each message must be 1 or 2 sentences.
- Tone must be warm, safe, and appropriate for a gift card.
- No emojis.
- No markdown.
- No numbering.
- Return only a valid JSON array of strings.
`;

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const text = response.output_text?.trim();

  if (!text) {
    throw new Error("Empty LLM response");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON from LLM");
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length < 2 ||
    parsed.length > 3 ||
    !parsed.every((item) => typeof item === "string" && item.trim().length > 0)
  ) {
    throw new Error("Unexpected LLM output format");
  }

  return {
    suggestions: parsed.map((item) => item.trim()),
    source: "llm",
  };
}