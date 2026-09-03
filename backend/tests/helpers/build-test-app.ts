import type { Express } from 'express';
import pino from 'pino';

import type { LlmProvider } from '../../src/domain/providers/llm-provider.js';
import type { SuggestionCache } from '../../src/domain/repositories/suggestion-cache.js';
import { loadEnv, type Env } from '../../src/pkg/config/env.js';
import { buildApp } from '../../src/main/app.js';
import { buildContainer } from '../../src/main/container.js';

/** Silent logger: tests assert behaviour, not console noise. */
const silentLogger = pino({ level: 'silent' });

export interface TestAppOptions {
  readonly env?: Partial<NodeJS.ProcessEnv>;
  readonly llmProvider?: LlmProvider;
  readonly suggestionCache?: SuggestionCache;
}

export function buildTestEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    LLM_PROVIDER: 'stub',
    CACHE_ENABLED: 'false',
    ...overrides,
  } as NodeJS.ProcessEnv);
}

export function buildTestApp(options: TestAppOptions = {}): Express {
  const env = buildTestEnv(options.env);
  const container = buildContainer(env, {
    logger: silentLogger,
    ...(options.llmProvider ? { llmProvider: options.llmProvider } : {}),
    ...(options.suggestionCache ? { suggestionCache: options.suggestionCache } : {}),
  });
  return buildApp(container);
}
