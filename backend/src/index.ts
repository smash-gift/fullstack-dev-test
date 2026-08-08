import { onRequest } from 'firebase-functions/v2/https';

import { loadConfig } from './config/env';
import { SuggestionService } from './domain/suggestionService';
import type { CacheStore, LlmClient } from './domain/types';
import { FallbackProvider } from './fallback/fallbackProvider';
import { createHandler } from './http/handler';
import { functionsLogger } from './logging/functionsLogger';

const config = loadConfig();

// Stage 3 replaces this with the OpenAI client. Until then every request takes
// the failure path, which is exactly what makes the fallback observable.
const llm: LlmClient = {
  async generate() {
    throw new Error('LLM client not wired yet');
  },
};

// Stage 4 replaces this with the Firestore-backed store.
const cache: CacheStore = {
  async get() {
    return null;
  },
  async set() {
    // no-op
  },
};

const service = new SuggestionService({
  llm,
  cache,
  fallback: new FallbackProvider(),
  logger: functionsLogger,
});

const handler = createHandler({
  service,
  logger: functionsLogger,
  allowedOrigins: config.allowedOrigins,
});

export const suggestions = onRequest(handler);
