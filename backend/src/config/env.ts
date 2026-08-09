export interface AppConfig {
  allowedOrigins: string[];
  openAiApiKey: string;
  openAiModel: string;
  llmTimeoutMs: number;
  forceLlmFailure: boolean;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  cacheTtlMs: number;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RATE_LIMIT_MAX = 30;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_CACHE_TTL_HOURS = 24;
const MS_PER_HOUR = 3_600_000;

/**
 * Reads configuration once, at module load.
 *
 * `backend/.env` is picked up automatically by firebase-functions, in the
 * emulator and on deploy alike, so nothing here needs a dotenv dependency.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    allowedOrigins: splitList(env.ALLOWED_ORIGINS, ['*']),
    openAiApiKey: (env.OPENAI_API_KEY ?? '').trim(),
    openAiModel: nonEmpty(env.OPENAI_MODEL, DEFAULT_MODEL),
    llmTimeoutMs: positiveInteger(env.LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    forceLlmFailure: isTrue(env.FORCE_LLM_FAILURE),
    rateLimitMax: positiveInteger(env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    rateLimitWindowMs: positiveInteger(env.RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    cacheTtlMs:
      positiveInteger(env.CACHE_TTL_HOURS, DEFAULT_CACHE_TTL_HOURS) * MS_PER_HOUR,
  };
}

function splitList(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : fallback;
}

function nonEmpty(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}
