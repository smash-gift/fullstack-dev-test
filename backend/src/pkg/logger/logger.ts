import pino, { type DestinationStream, type Logger } from 'pino';

export type { Logger };

export interface LoggerOptions {
  readonly level: string;
  /** Human-readable output for local development. */
  readonly pretty: boolean;
  /**
   * Where the lines go. Defaults to stdout; a test passes a stream so the
   * redaction policy can be asserted on the real configuration rather than on
   * a lookalike built inside the test.
   */
  readonly destination?: DestinationStream;
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
  const config = {
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
    ...(options.pretty && !options.destination
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
          },
        }
      : {}),
  };

  return options.destination ? pino(config, options.destination) : pino(config);
}
