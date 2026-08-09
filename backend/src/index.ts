import { onRequest } from 'firebase-functions/v2/https';

import { loadConfig } from './config/env';
import { SuggestionService } from './domain/suggestionService';
import type { LlmClient } from './domain/types';
import { FallbackProvider } from './fallback/fallbackProvider';
import { FirestoreCacheStore } from './firestore/cacheStore';
import { FirestoreRateLimiter } from './firestore/rateLimiter';
import { createHandler, type Handler } from './http/handler';
import { FailingLlmClient } from './llm/failingLlmClient';
import { OpenAiClient } from './llm/openAiClient';
import { functionsLogger } from './logging/functionsLogger';

/**
 * Picks the client the service will talk to.
 *
 * A missing key degrades to the fallback instead of refusing to boot: a
 * reviewer who has not set one up still gets a service that answers, and the
 * `source` field in the response says plainly which path ran.
 */
function createLlmClient(config: ReturnType<typeof loadConfig>): LlmClient {
  if (config.forceLlmFailure) {
    functionsLogger.warn('llm_forced_failure_enabled');
    return new FailingLlmClient('FORCE_LLM_FAILURE is enabled');
  }

  if (config.openAiApiKey.length === 0) {
    functionsLogger.error('openai_api_key_missing', {
      hint: 'Copy backend/.env.example to backend/.env and set OPENAI_API_KEY.',
    });
    return new FailingLlmClient('OPENAI_API_KEY is not configured');
  }

  return new OpenAiClient({
    apiKey: config.openAiApiKey,
    model: config.openAiModel,
    timeoutMs: config.llmTimeoutMs,
    logger: functionsLogger,
  });
}

function buildHandler(): Handler {
  const config = loadConfig();

  const service = new SuggestionService({
    llm: createLlmClient(config),
    cache: new FirestoreCacheStore({ ttlMs: config.cacheTtlMs }),
    fallback: new FallbackProvider(),
    logger: functionsLogger,
  });

  return createHandler({
    service,
    rateLimiter: new FirestoreRateLimiter({
      max: config.rateLimitMax,
      windowMs: config.rateLimitWindowMs,
    }),
    logger: functionsLogger,
    allowedOrigins: config.allowedOrigins,
  });
}

/**
 * Built on the first request rather than at import time.
 *
 * Cloud Functions loads this module once just to discover the exports, before
 * the environment from `.env` is in place — configuring anything at import time
 * reads an environment that is not the one requests will run under.
 */
let handler: Handler | undefined;

export const suggestions = onRequest(async (req, res) => {
  handler ??= buildHandler();
  await handler(req, res);
});
