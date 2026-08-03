import type { Firestore } from 'firebase-admin/firestore';
import { FirestoreSuggestionCache } from '../src/cache/firestoreCache';

/**
 * Minimal in-memory stand-in for the pieces of the Firestore Admin SDK the
 * cache uses (`collection().doc().get()/set()`), so we can unit-test the cache
 * logic (round-trip, TTL, expiry) without the emulator.
 */
function fakeFirestore() {
  const store = new Map<string, Record<string, unknown>>();
  const db = {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: store.has(id),
          data: () => store.get(id),
        }),
        set: async (value: Record<string, unknown>) => {
          store.set(id, value);
        },
      }),
    }),
  };
  return { db: db as unknown as Firestore, store };
}

describe('FirestoreSuggestionCache', () => {
  it('stores and retrieves suggestions (round-trip)', async () => {
    const { db } = fakeFirestore();
    const cache = new FirestoreSuggestionCache(db, 60_000);

    expect(await cache.get('birthday|friend|')).toBeUndefined();

    await cache.set('birthday|friend|', ['One.', 'Two.']);
    expect(await cache.get('birthday|friend|')).toEqual(['One.', 'Two.']);
  });

  it('treats an expired entry as a miss', async () => {
    const { db, store } = fakeFirestore();
    const cache = new FirestoreSuggestionCache(db, 60_000);

    await cache.set('k', ['a', 'b']);
    // Force the stored entry to be already expired.
    const id = [...store.keys()][0];
    store.set(id, { ...store.get(id), expiresAt: Date.now() - 1 });

    expect(await cache.get('k')).toBeUndefined();
  });

  it('is disabled when TTL is zero (no reads or writes)', async () => {
    const { db, store } = fakeFirestore();
    const cache = new FirestoreSuggestionCache(db, 0);

    await cache.set('k', ['a', 'b']);
    expect(store.size).toBe(0);
    expect(await cache.get('k')).toBeUndefined();
  });
});
