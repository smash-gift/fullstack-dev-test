import { loadEnv } from '../pkg/config/env.js';
import { createLogger } from '../pkg/logger/logger.js';
import { buildApp } from './app.js';
import { buildContainer } from './container.js';

function start(): void {
  const env = loadEnv();
  const container = buildContainer(env);
  const app = buildApp(container);
  const { logger } = container;

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, llmProvider: container.llmProvider.name },
      'server listening',
    );
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutting down');
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'error during shutdown');
        process.exit(1);
      }
      logger.info('shutdown complete');
      process.exit(0);
    });

    // Do not let a stuck connection keep the process alive forever.
    setTimeout(() => {
      logger.error('forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

try {
  start();
} catch (error) {
  // The configured logger may not exist yet — invalid configuration is the
  // usual cause of failing here — so this uses a minimal one rather than
  // dying silently.
  const fallbackLogger = createLogger({ level: 'error', pretty: false });
  fallbackLogger.error({ err: error }, 'failed to start server');
  process.exit(1);
}
