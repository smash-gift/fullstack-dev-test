import { SuggestionRequest } from '../types';
import { LlmProvider } from './llm.provider';

/**
 * A fake LLM that returns varied, on-topic suggestions without any network
 * call, key, or local model. Enable with `LLM_PROVIDER=mock`.
 *
 * Why it exists: it lets anyone exercise the real "LLM path" (source: "llm",
 * caching, the loading state) in seconds — ideal for demos, CI, and reviewers
 * who don't want to configure OpenAI or run Ollama. Unlike the static fallback
 * (which signals degradation), the mock stands in for a *working* provider.
 *
 * Output is deterministic per input, so identical requests are cache-friendly,
 * but it rotates through templates and reflects the optional `tone` so the
 * result visibly depends on the inputs.
 */
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';

  async generateSuggestions(input: SuggestionRequest): Promise<string[]> {
    // A touch of latency so the client's loading state is actually visible.
    await delay(200);

    const occasion = clean(input.occasion) || 'your special day';
    const relationship = clean(input.relationship) || 'you';
    const Occasion = capitalize(occasion);
    const tone = clean(input.tone ?? '');
    const toneWord = tone ? `${tone} ` : '';

    const templates: Array<() => string> = [
      () =>
        `Happy ${Occasion}, dear ${relationship}! Sending you a ${toneWord}note full of joy and every good wish.`,
      () =>
        `To ${article(relationship)} as wonderful as you — ${occasion} just isn't the same without you. Here's to celebrating you!`,
      () =>
        `Wishing you the warmest ${toneWord}${occasion} wishes, ${relationship}. You make the world brighter just by being you.`,
      () =>
        `${Occasion} calls for a celebration, and no one deserves it more than you, ${relationship}. Enjoy every single moment!`,
      () =>
        `Cheers to you this ${occasion}! Thank you for being such an amazing ${relationship} — today is all about you.`,
      () =>
        `Here's a ${toneWord}message for my favorite ${relationship}: may your ${occasion} be filled with love, laughter, and everything you hope for.`,
    ];

    // Deterministic starting point derived from the inputs, then pick three
    // consecutive templates so the set varies across occasion/relationship/tone.
    const start = hash(`${occasion}|${relationship}|${tone}`) % templates.length;
    return [0, 1, 2].map((i) => templates[(start + i) % templates.length]());
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

/** Small grammar helper so "a friend" / "an aunt" read naturally. */
function article(noun: string): string {
  return /^[aeiou]/.test(noun) ? `an ${noun}` : `a ${noun}`;
}

/** Tiny stable string hash for deterministic template rotation. */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}
