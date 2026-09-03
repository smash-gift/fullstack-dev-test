import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

const optionalSecret = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

/**
 * Which environment variable holds the credential for each provider.
 * `stub` needs none, which is what lets the app run with no credentials at all.
 */
const API_KEY_BY_PROVIDER = {
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  gemini: 'GEMINI_API_KEY',
} as const;

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().default('*'),

  // OpenAI is the default: the brief asks for "OpenAI or Google AI".
  // See docs/01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md
  LLM_PROVIDER: z.enum(['openai', 'openrouter', 'gemini', 'stub']).default('openai'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  // Low temperature makes the three suggestions nearly identical, which
  // defeats the point of asking for three. High makes them odd for a card.
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.8),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(400),

  // Model identifiers confirmed against each provider's live catalogue on
  // 2026-09-03 rather than assumed. See docs/02-phases/phase-03-llm-integration.md
  OPENAI_API_KEY: optionalSecret,
  OPENAI_MODEL: z.string().trim().min(1).default('gpt-4o-mini'),
  OPENROUTER_API_KEY: optionalSecret,
  OPENROUTER_MODEL: z.string().trim().min(1).default('openai/gpt-4o-mini'),
  GEMINI_API_KEY: optionalSecret,
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-3.8-flash'),

  CACHE_ENABLED: booleanFromString.default(true),
  CACHE_TTL_MS: z.coerce.number().int().positive().default(600_000),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(500),
});

/**
 * Cross-field rule: only the selected provider's key is required.
 *
 * Demanding all three would force anyone running the project to open accounts
 * with providers they are not using.
 */
const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.LLM_PROVIDER === 'stub') return;

  const variable = API_KEY_BY_PROVIDER[env.LLM_PROVIDER];
  if (!env[variable]) {
    ctx.addIssue({
      code: 'custom',
      path: [variable],
      message: `required when LLM_PROVIDER=${env.LLM_PROVIDER} (or set LLM_PROVIDER=stub to run without credentials)`,
    });
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * Reads and validates the environment. The only place that touches
 * `process.env`.
 *
 * Throws on invalid configuration so the process dies loudly at startup
 * instead of serving 500s later for a variable nobody set.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(env)'}: ${issue.message}`)
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
