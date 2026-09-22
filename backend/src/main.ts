import { SuggestMessages } from './application/suggest-messages.js';
import { loadConfig, loadDotEnv } from './infra/config.js';
import { DailyCallBudget } from './infra/daily-call-budget.js';
import { StaticFallbackCatalog } from './infra/fallback-catalog.js';
import { GeminiProvider } from './infra/gemini-provider.js';
import { ConsoleLogger } from './infra/logger.js';
import { InMemorySuggestionPoolCache } from './infra/suggestion-pool-cache.js';
import { FixedWindowRateLimiter } from './http/rate-limiter.js';
import { buildServer } from './http/server.js';

loadDotEnv();
const config = loadConfig();
const logger = new ConsoleLogger(config.logLevel);

const provider = new GeminiProvider({
  apiKey: config.geminiApiKey,
  model: config.geminiModel,
  maxRetries: config.llmMaxRetries,
});

const suggestMessages = new SuggestMessages({
  provider,
  fallback: new StaticFallbackCatalog(),
  cache: config.cacheEnabled
    ? new InMemorySuggestionPoolCache({
        ttlMs: config.cacheTtlMs,
        maxEntries: config.cacheMaxEntries,
      })
    : null,
  budget: new DailyCallBudget(config.dailyLlmCallBudget),
  logger,
  timeoutMs: config.llmTimeoutMs,
});

const rateLimiter = new FixedWindowRateLimiter(config.rateLimitMax, config.rateLimitWindowMs);
const sweeper = setInterval(() => rateLimiter.sweep(), config.rateLimitWindowMs);
sweeper.unref();

const app = buildServer({
  suggestMessages,
  logger,
  rateLimiter,
  corsOrigin: config.corsOrigin,
  llmConfigured: provider.isConfigured,
  trustProxy: config.trustProxy,
});

if (!provider.isConfigured) {
  logger.warn(
    {},
    'GEMINI_API_KEY is not set: every request will be answered from the fallback catalog',
  );
}

try {
  await app.listen({ port: config.port, host: config.host });
  logger.info({ port: config.port, host: config.host }, 'api listening');
} catch (error) {
  logger.error({ message: (error as Error).message }, 'failed to start');
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}
