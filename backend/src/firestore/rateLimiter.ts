import { Timestamp, type Firestore } from 'firebase-admin/firestore';

import { evaluateWindow, type WindowPolicy, type WindowState } from '../domain/rateLimitWindow';
import type { RateLimitDecision, RateLimiter } from '../domain/types';
import { firestore } from './db';

export const RATE_LIMIT_COLLECTION = 'rate_limits';

export interface FirestoreRateLimiterOptions extends WindowPolicy {
  db?: Firestore;
  now?: () => number;
}

/**
 * A fixed-window counter shared by every instance of the function.
 *
 * An in-process counter would be wrong here by construction: Cloud Functions
 * scales horizontally, so each instance would keep its own tally and the real
 * limit would be the configured one multiplied by however many instances
 * happen to be warm. The read-modify-write runs in a transaction because two
 * concurrent requests from the same user would otherwise both read the same
 * count and both write count + 1.
 */
export class FirestoreRateLimiter implements RateLimiter {
  private readonly policy: WindowPolicy;
  private readonly now: () => number;

  constructor(private readonly options: FirestoreRateLimiterOptions) {
    this.policy = { max: options.max, windowMs: options.windowMs };
    this.now = options.now ?? Date.now;
  }

  async consume(key: string): Promise<RateLimitDecision> {
    const db = this.options.db ?? firestore();
    const ref = db.collection(RATE_LIMIT_COLLECTION).doc(key);

    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const decision = evaluateWindow(readState(snapshot.data()), this.now(), this.policy);

      if (decision.nextState) {
        transaction.set(ref, {
          windowStart: Timestamp.fromMillis(decision.nextState.windowStartMs),
          count: decision.nextState.count,
        });
      }

      return {
        allowed: decision.allowed,
        retryAfterSeconds: decision.retryAfterSeconds,
      };
    });
  }
}

function readState(data: FirebaseFirestore.DocumentData | undefined): WindowState | null {
  if (!data) {
    return null;
  }

  const windowStart = data.windowStart;
  const count = data.count;

  if (!(windowStart instanceof Timestamp) || typeof count !== 'number') {
    // A document we did not write, or one from an older shape. Starting a fresh
    // window is the safe reading: it never locks a legitimate user out.
    return null;
  }

  return { windowStartMs: windowStart.toMillis(), count };
}
