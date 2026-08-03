import { buildPrompt } from '../utils/prompt';
import type { GeminiResponse, OpenAIResponse } from '../types';

const LLM_TIMEOUT_MS = 10_000;

function parseMessages(rawText: string): string[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();

  // Try exact delimiter first
  let parts = normalized.split(/\n---\n/);

  // Fallback: if delimiter not found, try with spaces around it
  if (parts.length === 1) {
    parts = normalized.split(/\n\s*---\s*\n/);
  }

  // Fallback: if still single part, split by double newline
  if (parts.length === 1) {
    parts = normalized.split(/\n\n+/);
  }

  return parts
    .map((msg) => msg.replace(/^\d+\.\s*/, '').trim())
    .filter((msg) => msg.length > 0)
    .slice(0, 3);
}

async function callGeminiAPI(prompt: string): Promise<string> {
  const model = 'gemini-2.5-flash';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(prompt: string): Promise<string> {
  const model = 'gpt-4o-mini';
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 512,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

export async function callAI(prompt: string, provider: string): Promise<string> {
  switch (provider.toLowerCase()) {
    case 'gemini':
      return callGeminiAPI(prompt);
    case 'openai':
      return callOpenAI(prompt);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export async function getSuggestions(
  occasion: string,
  relationship: string,
): Promise<string[]> {
  const provider = process.env.AI_PROVIDER ?? 'gemini';
  const prompt = buildPrompt(occasion, relationship);
  const rawText = await callAI(prompt, provider);
  const messages = parseMessages(rawText);

  if (messages.length === 0) {
    throw new Error('LLM returned no parseable messages');
  }

  return messages;
}
