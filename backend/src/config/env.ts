/**
 * Centralized, typed access to environment configuration.
 *
 * `dotenv` is loaded lazily here so that importing this module in tests does
 * not require a real `.env` file. Every value has a sensible default so the
 * server boots even with an empty environment (in fallback-only mode).
 */
import 'dotenv/config';

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export type LlmProviderName = 'openai' | 'gemini' | 'mock';

export const config = {
  port: num(process.env.PORT, 8080),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  llm: {
    provider: (process.env.LLM_PROVIDER as LlmProviderName) || 'openai',
    timeoutMs: num(process.env.LLM_TIMEOUT_MS, 8000),
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      // Optional override for any OpenAI-compatible endpoint (Azure, vLLM,
      // LM Studio, or a local Ollama at http://localhost:11434/v1). Blank uses
      // the real OpenAI API.
      baseUrl: process.env.OPENAI_BASE_URL || undefined,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ?? '',
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
    },
  },

  rateLimit: {
    max: num(process.env.RATE_LIMIT_MAX, 30),
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  },

  cache: {
    ttlMs: num(process.env.CACHE_TTL_MS, 300_000),
  },
} as const;

/**
 * True when we have a usable key for the selected provider. When false the
 * service short-circuits to the static fallback and never attempts a network
 * call — this is what lets the stack run without external credentials.
 */
export function isLlmConfigured(): boolean {
  // The mock provider needs no credentials — it always runs the "LLM path".
  if (config.llm.provider === 'mock') return true;
  if (config.llm.provider === 'openai') return config.llm.openai.apiKey.length > 0;
  if (config.llm.provider === 'gemini') return config.llm.gemini.apiKey.length > 0;
  return false;
}
