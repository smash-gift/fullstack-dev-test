/**
 * Jest setup — runs before the config module is imported so these values are
 * captured by `config`.
 *
 * We set a dummy API key so `isLlmConfigured()` returns true and the service
 * exercises its LLM path (using an injected mock provider — never the network).
 * Caching is disabled so tests don't interfere with each other, and the rate
 * limit is raised out of the way.
 */
process.env.OPENAI_API_KEY = 'test-key-not-real';
process.env.CACHE_TTL_MS = '0';
process.env.RATE_LIMIT_MAX = '1000';
