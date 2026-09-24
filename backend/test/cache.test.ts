import { describe, expect, it, vi } from 'vitest';
import { cacheKey, TtlCache } from '../src/lib/cache.js';

describe('cacheKey', () => {
  it('is case-insensitive and stable', () => {
    expect(cacheKey({ occasion: 'Birthday', relationship: 'Friend' })).toBe(
      cacheKey({ occasion: 'birthday', relationship: 'friend' }),
    );
  });
});

describe('TtlCache', () => {
  it('returns undefined when disabled (ttl = 0)', () => {
    const cache = new TtlCache<string>(0);
    cache.set('k', 'v');
    expect(cache.get('k')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('stores and returns a value within the TTL', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
  });

  it('expires entries after the TTL', () => {
    vi.useFakeTimers();
    try {
      const cache = new TtlCache<string>(1000);
      cache.set('k', 'v');
      vi.advanceTimersByTime(1001);
      expect(cache.get('k')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('evicts the oldest entry beyond maxEntries (LRU)', () => {
    const cache = new TtlCache<number>(10_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    // Touch 'a' so 'b' becomes least-recently-used.
    cache.get('a');
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });
});
