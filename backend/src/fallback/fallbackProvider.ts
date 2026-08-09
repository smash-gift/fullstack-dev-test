import { FALLBACK_MESSAGES } from './messages';

/** Returns a number in [0, 1). Injected so tests can make the draw deterministic. */
export type RandomFn = () => number;

export class FallbackProvider {
  private readonly messages: readonly string[];
  private readonly random: RandomFn;

  constructor(messages: readonly string[] = FALLBACK_MESSAGES, random: RandomFn = Math.random) {
    this.messages = messages;
    this.random = random;
  }

  /**
   * Draws `count` distinct messages at random.
   *
   * Random rather than fixed so two consecutive outages do not return the same
   * three lines, which reads to the user like a frozen screen.
   */
  pick(count: number): string[] {
    const pool = [...this.messages];
    const total = Math.min(count, pool.length);
    const picked: string[] = [];

    while (picked.length < total) {
      const index = Math.min(Math.floor(this.random() * pool.length), pool.length - 1);
      const [chosen] = pool.splice(index, 1);
      if (chosen !== undefined) {
        picked.push(chosen);
      }
    }

    return picked;
  }
}
