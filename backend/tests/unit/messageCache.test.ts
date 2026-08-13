import * as admin from 'firebase-admin';
import type { firestore } from 'firebase-admin';
import {
  hashCacheKey,
  noopMessageCache,
  createFirestoreMessageCache,
} from '../../src/services/messageCache';

describe('hashCacheKey', () => {
  it('returns a stable 64-char hex sha256 digest for the same input', () => {
    const a = hashCacheKey('["birthday","mother"]');
    const b = hashCacheKey('["birthday","mother"]');

    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different digests for different inputs', () => {
    expect(hashCacheKey('["birthday","mother"]')).not.toBe(
      hashCacheKey('["birthday","father"]'),
    );
  });
});

describe('noopMessageCache', () => {
  it('always misses on get', async () => {
    await expect(noopMessageCache.get('any-key')).resolves.toBeNull();
  });

  it('resolves silently on set', async () => {
    await expect(
      noopMessageCache.set('any-key', {
        occasion: 'birthday',
        relationship: 'mother',
        messages: ['a', 'b', 'c'],
      }),
    ).resolves.toBeUndefined();
  });
});

const DEFAULT_TTL_MS = 21600000;

interface FakeDoc {
  exists: boolean;
  data: Record<string, unknown>;
}

function makeFakeFirestore(initialDocs: Record<string, FakeDoc> = {}) {
  const docs = { ...initialDocs };
  const setCalls: Array<{ id: string; data: Record<string, unknown> }> = [];
  const updateCalls: Array<{ id: string; data: Record<string, unknown> }> = [];

  const db = {
    collection: (name: string) => {
      expect(name).toBe('messageCache');
      return {
        doc: (id: string) => ({
          get: async () => ({
            exists: docs[id]?.exists ?? false,
            get: (field: string) => docs[id]?.data?.[field],
          }),
          set: async (data: Record<string, unknown>) => {
            setCalls.push({ id, data });
          },
          update: async (data: Record<string, unknown>) => {
            updateCalls.push({ id, data });
          },
        }),
      };
    },
  };

  return { db: db as unknown as firestore.Firestore, setCalls, updateCalls };
}

describe('createFirestoreMessageCache', () => {
  it('returns null on a cache miss', async () => {
    const { db } = makeFakeFirestore();
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await expect(cache.get('["birthday","mother"]')).resolves.toBeNull();
  });

  it('returns the cached messages on a cache hit and increments hitCount', async () => {
    const key = '["birthday","mother"]';
    const { db, updateCalls } = makeFakeFirestore({
      [hashCacheKey(key)]: {
        exists: true,
        data: { messages: ['a', 'b', 'c'], hitCount: 2, createdAt: new Date() },
      },
    });
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    const result = await cache.get(key);
    expect(result).toEqual(['a', 'b', 'c']);

    // hitCount increment is fire-and-forget; flush microtasks before asserting.
    await Promise.resolve();
    expect(updateCalls).toEqual([
      {
        id: hashCacheKey(key),
        data: { hitCount: admin.firestore.FieldValue.increment(1) },
      },
    ]);
  });

  it('uses an atomic FieldValue.increment(1) rather than a manually computed value, so concurrent hits are not lost', async () => {
    const key = '["birthday","mother"]';
    const { db, updateCalls } = makeFakeFirestore({
      [hashCacheKey(key)]: {
        exists: true,
        data: { messages: ['a', 'b', 'c'], hitCount: 2, createdAt: new Date() },
      },
    });
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await cache.get(key);
    await Promise.resolve();

    expect(updateCalls[0].data.hitCount).not.toBe(3);
    expect(updateCalls[0].data.hitCount).toEqual(
      admin.firestore.FieldValue.increment(1),
    );
  });

  it('treats a document with messages missing as a cache miss', async () => {
    const key = '["birthday","mother"]';
    const { db, updateCalls } = makeFakeFirestore({
      [hashCacheKey(key)]: {
        exists: true,
        data: { hitCount: 2 },
      },
    });
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await expect(cache.get(key)).resolves.toBeNull();
    await Promise.resolve();
    expect(updateCalls).toEqual([]);
  });

  it('treats a document with an empty messages array as a cache miss', async () => {
    const key = '["birthday","mother"]';
    const { db } = makeFakeFirestore({
      [hashCacheKey(key)]: {
        exists: true,
        data: { messages: [], hitCount: 2 },
      },
    });
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await expect(cache.get(key)).resolves.toBeNull();
  });

  it('treats a document with fewer than 3 messages as a cache miss', async () => {
    const key = '["birthday","mother"]';
    const { db } = makeFakeFirestore({
      [hashCacheKey(key)]: {
        exists: true,
        data: { messages: ['a', 'b'], hitCount: 2 },
      },
    });
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await expect(cache.get(key)).resolves.toBeNull();
  });

  it('treats a document with a blank message entry as a cache miss', async () => {
    const key = '["birthday","mother"]';
    const { db } = makeFakeFirestore({
      [hashCacheKey(key)]: {
        exists: true,
        data: { messages: ['a', '   ', 'c'], hitCount: 2 },
      },
    });
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await expect(cache.get(key)).resolves.toBeNull();
  });

  it('writes occasion, relationship, messages, createdAt and hitCount:0 on set', async () => {
    const key = '["birthday","mother"]';
    const { db, setCalls } = makeFakeFirestore();
    const cache = createFirestoreMessageCache(db, DEFAULT_TTL_MS);

    await cache.set(key, {
      occasion: 'birthday',
      relationship: 'mother',
      messages: ['a', 'b', 'c'],
    });

    expect(setCalls).toHaveLength(1);
    expect(setCalls[0].id).toBe(hashCacheKey(key));
    expect(setCalls[0].data).toMatchObject({
      occasion: 'birthday',
      relationship: 'mother',
      messages: ['a', 'b', 'c'],
      hitCount: 0,
    });
    expect(setCalls[0].data.createdAt).toBeInstanceOf(Date);
  });

  describe('TTL expiry', () => {
    const TTL_MS = 21600000;
    let nowSpy: ReturnType<typeof jest.spyOn>;

    afterEach(() => {
      nowSpy?.mockRestore();
    });

    it('treats an entry within the TTL window as a hit and increments hitCount', async () => {
      const fixedNow = 1_700_000_000_000;
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
      const key = '["birthday","mother"]';
      const createdAt = new Date(fixedNow - TTL_MS + 1);
      const { db, updateCalls } = makeFakeFirestore({
        [hashCacheKey(key)]: {
          exists: true,
          data: { messages: ['a', 'b', 'c'], hitCount: 0, createdAt },
        },
      });
      const cache = createFirestoreMessageCache(db, TTL_MS);

      await expect(cache.get(key)).resolves.toEqual(['a', 'b', 'c']);
      await Promise.resolve();
      expect(updateCalls).toHaveLength(1);
    });

    it('treats an entry older than the TTL as a cache miss and does not increment hitCount', async () => {
      const fixedNow = 1_700_000_000_000;
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
      const key = '["birthday","mother"]';
      const createdAt = new Date(fixedNow - TTL_MS - 1);
      const { db, updateCalls } = makeFakeFirestore({
        [hashCacheKey(key)]: {
          exists: true,
          data: { messages: ['a', 'b', 'c'], hitCount: 0, createdAt },
        },
      });
      const cache = createFirestoreMessageCache(db, TTL_MS);

      await expect(cache.get(key)).resolves.toBeNull();
      await Promise.resolve();
      expect(updateCalls).toEqual([]);
    });

    it('treats an entry exactly at the TTL boundary as still valid (hit)', async () => {
      const fixedNow = 1_700_000_000_000;
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
      const key = '["birthday","mother"]';
      const createdAt = new Date(fixedNow - TTL_MS);
      const { db, updateCalls } = makeFakeFirestore({
        [hashCacheKey(key)]: {
          exists: true,
          data: { messages: ['a', 'b', 'c'], hitCount: 0, createdAt },
        },
      });
      const cache = createFirestoreMessageCache(db, TTL_MS);

      await expect(cache.get(key)).resolves.toEqual(['a', 'b', 'c']);
      await Promise.resolve();
      expect(updateCalls).toHaveLength(1);
    });

    it('supports a Firestore Timestamp-like createdAt value with a toDate() method', async () => {
      const fixedNow = 1_700_000_000_000;
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
      const key = '["birthday","mother"]';
      const createdAtDate = new Date(fixedNow - 1000);
      const fakeTimestamp = { toDate: () => createdAtDate };
      const { db, updateCalls } = makeFakeFirestore({
        [hashCacheKey(key)]: {
          exists: true,
          data: { messages: ['a', 'b', 'c'], hitCount: 0, createdAt: fakeTimestamp },
        },
      });
      const cache = createFirestoreMessageCache(db, TTL_MS);

      await expect(cache.get(key)).resolves.toEqual(['a', 'b', 'c']);
      await Promise.resolve();
      expect(updateCalls).toHaveLength(1);
    });
  });
});
