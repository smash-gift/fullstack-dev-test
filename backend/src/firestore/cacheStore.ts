import { Timestamp, type Firestore } from 'firebase-admin/firestore';

import type { CacheStore, SuggestionRequest } from '../domain/types';
import { firestore } from './db';

export const CACHE_COLLECTION = 'suggestion_cache';

export interface FirestoreCacheStoreOptions {
  ttlMs: number;
  db?: Firestore;
  now?: () => number;
}

/**
 * Stores generated suggestions so an input we have already paid for does not
 * cost a second model call.
 *
 * Expiry is checked on read rather than relying on Firestore's TTL policy,
 * which is a background process and does not run in the emulator at all — a
 * document being physically present says nothing about it still being valid.
 */
export class FirestoreCacheStore implements CacheStore {
  private readonly now: () => number;

  constructor(private readonly options: FirestoreCacheStoreOptions) {
    this.now = options.now ?? Date.now;
  }

  async get(key: string): Promise<string[] | null> {
    const snapshot = await this.collection().doc(key).get();
    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();
    const createdAt = data?.createdAt;

    if (!(createdAt instanceof Timestamp)) {
      return null;
    }

    if (this.now() - createdAt.toMillis() > this.options.ttlMs) {
      return null;
    }

    // Returned as-is: the service re-checks the contract, because a document
    // can hold anything regardless of what its type says.
    return Array.isArray(data?.suggestions) ? (data.suggestions as string[]) : null;
  }

  async set(key: string, suggestions: string[], input: SuggestionRequest): Promise<void> {
    await this.collection()
      .doc(key)
      .set({
        suggestions,
        // Kept for readability when inspecting the collection; the key itself
        // is a hash and tells nobody what it stands for.
        occasion: input.occasion,
        relationship: input.relationship,
        createdAt: Timestamp.fromMillis(this.now()),
      });
  }

  private collection() {
    return (this.options.db ?? firestore()).collection(CACHE_COLLECTION);
  }
}
