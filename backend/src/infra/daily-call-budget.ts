import type { CallBudget } from '../domain/ports.js';

/**
 * A hard ceiling on paid calls per process per day. Once it is spent the API
 * keeps answering, from the fallback catalog, instead of running up a bill.
 */
export class DailyCallBudget implements CallBudget {
  private windowStartedAt = Date.now();
  private used = 0;

  constructor(private readonly max: number) {}

  tryConsume(): boolean {
    const now = Date.now();
    if (now - this.windowStartedAt >= 86_400_000) {
      this.windowStartedAt = now;
      this.used = 0;
    }
    if (this.used >= this.max) return false;
    this.used += 1;
    return true;
  }
}
