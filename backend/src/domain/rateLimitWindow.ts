export interface WindowState {
  windowStartMs: number;
  count: number;
}

export interface WindowPolicy {
  max: number;
  windowMs: number;
}

export interface WindowDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  /** The state to persist, or undefined when nothing needs writing. */
  nextState?: WindowState;
}

/**
 * The fixed-window arithmetic, kept free of Firestore.
 *
 * This is the part that is easy to get wrong — off-by-one at the limit, a
 * window that never resets, a Retry-After of zero — so it lives in a pure
 * function that tests can drive with an explicit clock. The Firestore class
 * around it only reads, calls this, and writes.
 */
export function evaluateWindow(
  state: WindowState | null,
  nowMs: number,
  policy: WindowPolicy,
): WindowDecision {
  const expired = state === null || nowMs - state.windowStartMs >= policy.windowMs;

  if (expired) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      nextState: { windowStartMs: nowMs, count: 1 },
    };
  }

  if (state.count >= policy.max) {
    const msLeft = state.windowStartMs + policy.windowMs - nowMs;
    return {
      allowed: false,
      // Always at least a second: telling a client to retry in 0 invites an
      // immediate second rejection.
      retryAfterSeconds: Math.max(1, Math.ceil(msLeft / 1000)),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    nextState: { windowStartMs: state.windowStartMs, count: state.count + 1 },
  };
}
