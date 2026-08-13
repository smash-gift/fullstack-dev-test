import * as crypto from "crypto";
import * as admin from "firebase-admin";
import type { firestore } from "firebase-admin";
import { getFirestore } from "../firebase/firebaseAdmin";
import { getEnv } from "../config/env";

export interface MessageCacheEntry {
  occasion: string;
  relationship: string;
  messages: string[];
}

export interface MessageCache {
  get(key: string): Promise<string[] | null>;
  set(key: string, entry: MessageCacheEntry): Promise<void>;
}

export function hashCacheKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

const EXPECTED_MESSAGE_COUNT = 3;

function isValidCachedMessages(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === EXPECTED_MESSAGE_COUNT &&
    value.every((message) => typeof message === "string" && message.trim().length > 0)
  );
}

export const noopMessageCache: MessageCache = {
  async get(): Promise<string[] | null> {
    return null;
  },
  async set(): Promise<void> {
    // Intentionally no-op: used when no cache backend is configured/available.
  },
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function createFirestoreMessageCache(
  db: firestore.Firestore,
  ttlMs: number,
): MessageCache {
  const collection = db.collection("messageCache");

  return {
    async get(key: string): Promise<string[] | null> {
      const docRef = collection.doc(hashCacheKey(key));
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        return null;
      }

      const messages: unknown = snapshot.get("messages");
      if (!isValidCachedMessages(messages)) {
        console.error(
          "messageCache: ignoring corrupted cache entry (messages is not exactly 3 non-empty strings)",
          { id: hashCacheKey(key) },
        );
        return null;
      }

      const createdAt = toDate(snapshot.get("createdAt"));
      if (!createdAt || Date.now() - createdAt.getTime() > ttlMs) {
        return null;
      }

      docRef
        .update({ hitCount: admin.firestore.FieldValue.increment(1) })
        .catch((err) => {
          console.error("messageCache: failed to increment hitCount", {
            message: (err as Error).message,
          });
        });

      return messages;
    },

    async set(key: string, entry: MessageCacheEntry): Promise<void> {
      const docRef = collection.doc(hashCacheKey(key));
      await docRef.set({
        occasion: entry.occasion,
        relationship: entry.relationship,
        messages: entry.messages,
        createdAt: new Date(),
        hitCount: 0,
      });
    },
  };
}

let loggedInitFailure = false;
let defaultCacheInstance: MessageCache | null = null;

export function getDefaultMessageCache(): MessageCache {
  if (defaultCacheInstance) {
    return defaultCacheInstance;
  }

  try {
    const db = getFirestore();
    defaultCacheInstance = createFirestoreMessageCache(db, getEnv().messageCacheTtlMs);
  } catch (err) {
    if (!loggedInitFailure) {
      console.error(
        "messageCache: Firebase Admin unavailable, falling back to a no-op cache",
        { message: (err as Error).message },
      );
      loggedInitFailure = true;
    }
    defaultCacheInstance = noopMessageCache;
  }

  return defaultCacheInstance;
}
