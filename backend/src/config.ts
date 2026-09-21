import 'dotenv/config';

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: positiveInteger(process.env.PORT, 3000),
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
  geminiModel: process.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest',
  geminiTimeoutMs: positiveInteger(process.env.GEMINI_TIMEOUT_MS, 8_000),
  rateLimitMax: positiveInteger(process.env.RATE_LIMIT_MAX, 30),
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW?.trim() || '1 minute',
} as const;
