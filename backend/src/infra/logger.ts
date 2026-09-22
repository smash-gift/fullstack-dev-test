import type { Logger } from '../domain/ports.js';

const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type Level = (typeof LEVELS)[number];

/**
 * Structured lines only, and never the prompt or the raw user input: an
 * occasion field is free text and can carry personal data.
 */
export class ConsoleLogger implements Logger {
  private readonly threshold: number;

  constructor(level: string) {
    const index = LEVELS.indexOf(level as Level);
    this.threshold = index === -1 ? 1 : index;
  }

  info(payload: Record<string, unknown>, message: string): void {
    this.write('info', payload, message);
  }

  warn(payload: Record<string, unknown>, message: string): void {
    this.write('warn', payload, message);
  }

  error(payload: Record<string, unknown>, message: string): void {
    this.write('error', payload, message);
  }

  private write(level: Level, payload: Record<string, unknown>, message: string): void {
    if (LEVELS.indexOf(level) < this.threshold) return;
    const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...payload });
    if (level === 'error') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  }
}
