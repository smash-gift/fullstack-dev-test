import { buildApp } from './app.js';
import { config } from './config.js';
import { createGeminiClient } from './llm/gemini-client.js';

const app = buildApp({
  llmClient: createGeminiClient({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    timeoutMs: config.geminiTimeoutMs,
  }),
});

try {
  await app.listen({ host: '0.0.0.0', port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
