import { describe, expect, it, vi } from 'vitest';
import { InMemorySuggestionPoolCache } from '../src/infra/suggestion-pool-cache.js';

const options = { ttlMs: 1000, maxEntries: 2 };

describe('InMemorySuggestionPoolCache', () => {
  it('should return nothing for an unknown key', () => {
    const cache = new InMemorySuggestionPoolCache(options);

    expect(cache.read('missing')).toBeUndefined();
  });

  it('should accumulate distinct suggestions under the same key', () => {
    const cache = new InMemorySuggestionPoolCache(options);

    cache.merge('k', [{ id: 's1', text: 'One.' }]);
    cache.merge('k', [
      { id: 's1', text: 'one.' },
      { id: 's2', text: 'Two.' },
    ]);

    expect(cache.read('k')?.map((item) => item.text)).toEqual(['One.', 'Two.']);
  });

  it('should expire entries after the ttl', () => {
    vi.useFakeTimers();
    const cache = new InMemorySuggestionPoolCache(options);
    cache.merge('k', [{ id: 's1', text: 'One.' }]);

    vi.advanceTimersByTime(1001);

    expect(cache.read('k')).toBeUndefined();
    vi.useRealTimers();
  });

  it('should evict the least recently used key past the capacity', () => {
    const cache = new InMemorySuggestionPoolCache(options);

    cache.merge('a', [{ id: 's1', text: 'A.' }]);
    cache.merge('b', [{ id: 's1', text: 'B.' }]);
    cache.read('a');
    cache.merge('c', [{ id: 's1', text: 'C.' }]);

    expect(cache.read('b')).toBeUndefined();
    expect(cache.read('a')).toBeDefined();
  });
});
