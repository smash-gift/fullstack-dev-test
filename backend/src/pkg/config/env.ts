import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().default('*'),

  // `stub` is the default while the real adapters are being built (phase 03).
  // It needs no credentials, so the server boots with an empty .env.
  LLM_PROVIDER: z.enum(['stub', 'openai', 'openrouter', 'gemini']).default('stub'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

  CACHE_ENABLED: booleanFromString.default(true),
  CACHE_TTL_MS: z.coerce.number().int().positive().default(600_000),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(500),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Reads and validates the environment. The only place in the codebase that
 * touches `process.env`.
 *
 * Throws on invalid configuration so the process fails loudly at startup
 * rather than serving 500s later for a missing variable.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${details}`);
  }

  return result.data;
}

export function parseCorsOrigins(value: string): string[] | '*' {
  if (value.trim() === '*') return '*';
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
