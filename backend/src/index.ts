import { loadConfig } from './lib/config.js';
import { buildServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildServer({ config });

  const shutdown = (signal: string): void => {
    app.log.info({ signal }, 'shutting down');
    app
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        app.log.error({ err }, 'error during shutdown');
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    if (!config.llmEnabled) {
      app.log.warn(
        'GEMINI_API_KEY is not set — running in fallback-only mode.',
      );
    }
  } catch (err) {
    app.log.error({ err }, 'failed to start server');
    process.exit(1);
  }
}

void main();
