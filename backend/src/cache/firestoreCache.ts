import type { Firestore } from 'firebase-admin/firestore';
import { SuggestionCache } from './suggestionCache';

/**
 * Firestore-backed cache. Unlike the in-memory cache, it survives cold starts
 * and is shared across function instances — the natural production choice when
 * the API runs as a Cloud Function. TTL is enforced in the document so a stale
 * entry is treated as a miss (and can be swept by a scheduled job / Firestore
 * TTL policy in production).
 *
 * `firebase-admin` is imported as a type only, so this file adds no runtime
 * dependency to the standalone server — it is only ever instantiated from the
 * Functions entry point.
 */
export class FirestoreSuggestionCache implements SuggestionCache {
  constructor(
    private readonly db: Firestore,
    private readonly ttlMs: number,
    private readonly collection = 'suggestion_cache',
  ) {}

  async get(key: string): Promise<string[] | undefined> {
    if (this.ttlMs <= 0) return undefined;
    const snap = await this.db.collection(this.collection).doc(docId(key)).get();
    if (!snap.exists) return undefined;

    const data = snap.data() as { suggestions?: unknown; expiresAt?: unknown } | undefined;
    const { suggestions, expiresAt } = data ?? {};
    if (!Array.isArray(suggestions) || typeof expiresAt !== 'number') return undefined;
    if (Date.now() > expiresAt) return undefined;

    return suggestions.filter((s): s is string => typeof s === 'string');
  }

  async set(key: string, value: string[]): Promise<void> {
    if (this.ttlMs <= 0) return;
    await this.db
      .collection(this.collection)
      .doc(docId(key))
      .set({
        key,
        suggestions: value,
        expiresAt: Date.now() + this.ttlMs,
        updatedAt: Date.now(),
      });
  }
}

/** Firestore doc ids can't contain '/'; encode the cache key safely. */
function docId(key: string): string {
  return Buffer.from(key).toString('base64url');
}
