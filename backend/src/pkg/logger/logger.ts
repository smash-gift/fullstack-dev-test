import pino, { type Logger } from 'pino';

import type { Env } from '../config/env.js';

export type { Logger };

/**
 * Structured JSON logging.
 *
 * JSON output is also a security property: a newline inside a user-supplied
 * value is escaped rather than producing a forged log line.
 *
 * `redact` is a safety net, not the primary control — credentials are simply
 * never passed to the logger.
 */
export function createLogger(env: Env): Logger {
  const isDevelopment = env.NODE_ENV === 'development';

  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        'apiKey',
        '*.apiKey',
        'authorization',
        'req.headers.authorization',
        'headers.authorization',
      ],
      censor: '[redacted]',
    },
    ...(isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
          },
        }
      : {}),
  });
}
