import { describe, expect, it } from 'vitest';

import type { Suggestion } from '../../src/domain/entities/suggestion.js';
import { InMemorySuggestionCache } from '../../src/infra/cache/in-memory-suggestion-cache.js';

const suggestions: Suggestion[] = [{ id: 'sug_1', text: 'Happy birthday!' }];

/** Controllable clock, so TTL tests do not wait in real time. */
function fakeClock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('InMemorySuggestionCache', () => {
  it('returns null on a miss', async () => {
    const cache = new InMemorySuggestionCache({ maxEntries: 10 });
    expect(await cache.get('absent')).toBeNull();
  });

  it('returns what was stored', async () => {
    const cache = new InMemorySuggestionCache({ maxEntries: 10 });
    await cache.set('k', suggestions, 1000);
    expect(await cache.get('k')).toEqual(suggestions);
  });

  it('expires an entry once its TTL has passed', async () => {
    const clock = fakeClock();
    const cache = new InMemorySuggestionCache({ maxEntries: 10, now: clock.now });

    await cache.set('k', suggestions, 1000);
    clock.advance(999);
    expect(await cache.get('k')).toEqual(suggestions);

    clock.advance(2);
    expect(await cache.get('k')).toBeNull();
  });

  it('evicts the least recently used entry when full', async () => {
    const cache = new InMemorySuggestionCache({ maxEntries: 2 });

    await cache.set('a', suggestions, 10_000);
    await cache.set('b', suggestions, 10_000);
    await cache.get('a'); // 'a' becomes most recently used
    await cache.set('c', suggestions, 10_000);

    expect(await cache.get('b')).toBeNull();
    expect(await cache.get('a')).toEqual(suggestions);
    expect(await cache.get('c')).toEqual(suggestions);
    expect(cache.size).toBe(2);
  });

  it('keeps distinct keys apart', async () => {
    const cache = new InMemorySuggestionCache({ maxEntries: 10 });
    const other: Suggestion[] = [{ id: 'sug_2', text: 'Congratulations!' }];

    await cache.set('a', suggestions, 10_000);
    await cache.set('b', other, 10_000);

    expect(await cache.get('a')).toEqual(suggestions);
    expect(await cache.get('b')).toEqual(other);
  });
});
