import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateWindow } from '../src/domain/rateLimitWindow';

const POLICY = { max: 30, windowMs: 60_000 };
const T0 = 1_000_000;

describe('evaluateWindow', () => {
  it('opens a window for a caller it has never seen', () => {
    const decision = evaluateWindow(null, T0, POLICY);

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.nextState, { windowStartMs: T0, count: 1 });
  });

  it('counts up inside the window without moving its start', () => {
    const decision = evaluateWindow({ windowStartMs: T0, count: 5 }, T0 + 30_000, POLICY);

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.nextState, { windowStartMs: T0, count: 6 });
  });

  it('allows exactly the configured number of requests', () => {
    const thirtieth = evaluateWindow({ windowStartMs: T0, count: 29 }, T0 + 1, POLICY);
    assert.equal(thirtieth.allowed, true, 'the 30th request is still within the limit');

    const thirtyFirst = evaluateWindow({ windowStartMs: T0, count: 30 }, T0 + 1, POLICY);
    assert.equal(thirtyFirst.allowed, false, 'the 31st is not');
  });

  it('writes nothing when it rejects, so a blocked caller cannot extend its own window', () => {
    const decision = evaluateWindow({ windowStartMs: T0, count: 30 }, T0 + 1, POLICY);

    assert.equal(decision.nextState, undefined);
  });

  it('reports how long is left, never zero', () => {
    const early = evaluateWindow({ windowStartMs: T0, count: 30 }, T0 + 10_000, POLICY);
    assert.equal(early.retryAfterSeconds, 50);

    const last = evaluateWindow({ windowStartMs: T0, count: 30 }, T0 + 59_999, POLICY);
    assert.equal(last.retryAfterSeconds, 1);
  });

  it('starts a fresh window once the old one has elapsed', () => {
    const decision = evaluateWindow({ windowStartMs: T0, count: 30 }, T0 + 60_000, POLICY);

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.nextState, { windowStartMs: T0 + 60_000, count: 1 });
  });
});
