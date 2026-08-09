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
/**
 * Seconds, deliberately.
 *
 * At this length the cache is a de-duplication window rather than a cost
 * optimisation: it absorbs a double tap and a quick reload, and nothing more.
 * That is the trade chosen on purpose — suggestions are the product, and a
 * longer window would hand everyone asking for the same occasion and
 * relationship the identical three messages.
 *
 * It still pays for itself, since a Firestore read costs orders of magnitude
 * less than a model call, but the real cost lever in production would be a
 * longer window on a shared cache, bought with variety.
 */
const DEFAULT_CACHE_TTL_SECONDS = 10;
const MS_PER_SECOND = 1000;

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
      positiveInteger(env.CACHE_TTL_SECONDS, DEFAULT_CACHE_TTL_SECONDS) * MS_PER_SECOND,
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
