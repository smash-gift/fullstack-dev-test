import { createApp } from './app';
import { config, isLlmConfigured } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info('Backend started', {
    port: config.port,
    provider: config.llm.provider,
    llmConfigured: isLlmConfigured(),
    mode: isLlmConfigured() ? 'live-llm' : 'fallback-only (no API key set)',
  });
});
