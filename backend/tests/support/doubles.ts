import type {
  CacheStore,
  LlmClient,
  Logger,
  SuggestionRequest,
} from '../../src/domain/types';

export interface CacheWrite {
  key: string;
  suggestions: string[];
  input: SuggestionRequest;
}

export class FakeCache implements CacheStore {
  readonly writes: CacheWrite[] = [];
  readonly entries = new Map<string, string[]>();
  failOnGet = false;
  failOnSet = false;

  async get(key: string): Promise<string[] | null> {
    if (this.failOnGet) {
      throw new Error('cache unavailable');
    }
    return this.entries.get(key) ?? null;
  }

  async set(key: string, suggestions: string[], input: SuggestionRequest): Promise<void> {
    if (this.failOnSet) {
      throw new Error('cache unavailable');
    }
    this.writes.push({ key, suggestions, input });
    this.entries.set(key, suggestions);
  }

  seed(key: string, suggestions: string[]): void {
    this.entries.set(key, suggestions);
  }
}

export class FakeLlm implements LlmClient {
  calls = 0;

  constructor(private readonly behaviour: () => Promise<string[]>) {}

  static respondingWith(suggestions: string[]): FakeLlm {
    return new FakeLlm(async () => suggestions);
  }

  static failingWith(error: Error): FakeLlm {
    return new FakeLlm(async () => {
      throw error;
    });
  }

  async generate(_input: SuggestionRequest): Promise<string[]> {
    this.calls += 1;
    return this.behaviour();
  }
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
}

export class FakeLogger implements Logger {
  readonly entries: LogEntry[] = [];

  info(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: 'info', message, context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: 'warn', message, context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: 'error', message, context });
  }

  has(message: string): boolean {
    return this.entries.some((entry) => entry.message === message);
  }
}

/** Cycles through fixed values so a random draw becomes reproducible in tests. */
export function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
}
