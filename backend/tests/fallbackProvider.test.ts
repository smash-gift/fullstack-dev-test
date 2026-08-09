import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FallbackProvider } from '../src/fallback/fallbackProvider';
import { FALLBACK_MESSAGES } from '../src/fallback/messages';
import { sequenceRandom } from './support/doubles';

describe('FallbackProvider', () => {
  it('draws the requested number of distinct messages', () => {
    const picked = new FallbackProvider().pick(3);

    assert.equal(picked.length, 3);
    assert.equal(new Set(picked).size, 3);
    assert.ok(picked.every((message) => FALLBACK_MESSAGES.includes(message)));
  });

  it('is deterministic when the random source is', () => {
    const draw = () => new FallbackProvider(FALLBACK_MESSAGES, sequenceRandom([0, 0, 0])).pick(3);

    assert.deepEqual(draw(), draw());
    assert.deepEqual(draw(), FALLBACK_MESSAGES.slice(0, 3));
  });

  it('varies between draws so repeated outages do not look frozen', () => {
    const first = new FallbackProvider(FALLBACK_MESSAGES, sequenceRandom([0, 0, 0])).pick(3);
    const second = new FallbackProvider(FALLBACK_MESSAGES, sequenceRandom([0.5, 0.5, 0.5])).pick(3);

    assert.notDeepEqual(first, second);
  });

  it('never asks for more messages than it has', () => {
    const provider = new FallbackProvider(['only one']);

    assert.deepEqual(provider.pick(3), ['only one']);
  });

  it('keeps every message safe to send unchanged', () => {
    for (const message of FALLBACK_MESSAGES) {
      assert.ok(message.trim().length > 0, 'message must not be blank');
      assert.ok(message.length <= 200, `message too long: ${message}`);
    }

    assert.equal(new Set(FALLBACK_MESSAGES).size, FALLBACK_MESSAGES.length, 'no duplicates');
  });
});
