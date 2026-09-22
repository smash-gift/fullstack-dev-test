interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed window per client, in process. It exists to protect the LLM budget of
 * this single instance; a multi-instance deployment needs a shared store, which
 * the README calls out.
 */
export class FixedWindowRateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  check(clientId: string): RateLimitDecision {
    const now = Date.now();
    const current = this.windows.get(clientId);

    if (!current || current.resetAt <= now) {
      this.windows.set(clientId, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.max - 1, retryAfterSeconds: 0 };
    }

    current.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

    if (current.count > this.max) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    return { allowed: true, remaining: this.max - current.count, retryAfterSeconds };
  }

  sweep(): void {
    const now = Date.now();
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
  }
}
