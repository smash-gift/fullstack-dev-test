import { z } from 'zod';

/**
 * Environment schema. Validated once at boot so the rest of the app can rely
 * on well-typed, sane configuration. Missing GEMINI_API_KEY is allowed on
 * purpose: the server then runs in fallback-only mode.
 */
const envSchema = z.object({
  GEMINI_API_KEY: z.string().trim().optional(),
  GEMINI_MODEL: z.string().trim().default('gemini-3.1-flash-lite'),

  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().trim().default('0.0.0.0'),

  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  LLM_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_WINDOW: z.string().trim().default('1 minute'),

  CACHE_TTL_MS: z.coerce.number().int().min(0).default(0),

  CORS_ORIGIN: z.string().trim().default('*'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type AppConfig = z.infer<typeof envSchema> & {
  llmEnabled: boolean;
  corsOrigins: string[] | boolean;
};

let cached: AppConfig | undefined;

/** Parse and cache configuration from process.env. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const value = parsed.data;
  const corsOrigins =
    value.CORS_ORIGIN === '*'
      ? true
      : value.CORS_ORIGIN.split(',')
          .map((o) => o.trim())
          .filter(Boolean);

  cached = {
    ...value,
    llmEnabled: Boolean(value.GEMINI_API_KEY),
    corsOrigins,
  };
  return cached;
}

/** Test helper to reset the memoised config. */
export function resetConfigCache(): void {
  cached = undefined;
}
