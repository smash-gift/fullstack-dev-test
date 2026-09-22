import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw !== 'false' && raw !== '0';
}

/**
 * Loads `.env` from the working directory when it exists. Variables already
 * present in the environment win, so a deploy that injects real values is
 * never overridden by a file left behind.
 */
export function loadDotEnv(path = resolve(process.cwd(), '.env')): void {
  if (!existsSync(path)) return;
  process.loadEnvFile(path);
}

export interface AppConfig {
  port: number;
  host: string;
  logLevel: string;
  trustProxy: boolean;
  geminiApiKey: string;
  geminiModel: string;
  llmTimeoutMs: number;
  llmMaxRetries: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  dailyLlmCallBudget: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
  cacheMaxEntries: number;
  corsOrigin: string;
}

export function loadConfig(): AppConfig {
  return {
    port: readInt('PORT', 3000),
    host: process.env.HOST ?? '0.0.0.0',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    trustProxy: readBool('TRUST_PROXY', false),
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
    llmTimeoutMs: readInt('LLM_TIMEOUT_MS', 8000),
    llmMaxRetries: readInt('LLM_MAX_RETRIES', 1),
    rateLimitMax: readInt('RATE_LIMIT_MAX', 30),
    rateLimitWindowMs: readInt('RATE_LIMIT_WINDOW_MS', 60000),
    dailyLlmCallBudget: readInt('DAILY_LLM_CALL_BUDGET', 500),
    cacheEnabled: readBool('CACHE_ENABLED', true),
    cacheTtlMs: readInt('CACHE_TTL_MS', 3_600_000),
    cacheMaxEntries: readInt('CACHE_MAX_ENTRIES', 500),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  };
}
