import pino, { type Logger } from 'pino';

export type { Logger };

export interface LoggerOptions {
  readonly level: string;
  /** Human-readable output for local development. */
  readonly pretty: boolean;
}

/**
 * Structured JSON logging.
 *
 * JSON output is also a security property: a newline inside a user-supplied
 * value is escaped rather than producing a forged log line.
 *
 * `redact` is a safety net, not the primary control — credentials are simply
 * never passed to the logger.
 */
export function createLogger(options: LoggerOptions): Logger {
  return pino({
    level: options.level,
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
    ...(options.pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
          },
        }
      : {}),
  });
}
