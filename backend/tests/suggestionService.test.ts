import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cacheKey } from '../src/domain/cacheKey';
import { SuggestionService } from '../src/domain/suggestionService';
import type { SuggestionRequest } from '../src/domain/types';
import { FallbackProvider } from '../src/fallback/fallbackProvider';
import { FakeCache, FakeLlm, FakeLogger } from './support/doubles';

const INPUT: SuggestionRequest = { occasion: 'Birthday', relationship: 'Friend' };

const VALID_OUTPUT = [
  'Happy birthday! Hope your day is a great one.',
  'Wishing you a wonderful year ahead.',
  'Have the best birthday yet.',
];

function build(llm: FakeLlm) {
  const cache = new FakeCache();
  const logger = new FakeLogger();
  const service = new SuggestionService({
    llm,
    cache,
    logger,
    fallback: new FallbackProvider(),
  });
  return { service, cache, logger };
}

describe('SuggestionService', () => {
  // Test 1 — the failure path the brief singles out.
  it('falls back when the model times out', async () => {
    const llm = FakeLlm.failingWith(new Error('LLM timed out after 8000ms'));
    const { service, logger } = build(llm);

    const result = await service.suggest(INPUT);

    assert.equal(result.source, 'fallback');
    assert.equal(result.suggestions.length, 3);
    assert.ok(result.suggestions.every((message) => message.trim().length > 0));
    assert.ok(logger.has('llm_generation_failed'));
  });

  // Test 2 — a response that arrives but does not honour the contract.
  it('falls back when the model returns too few suggestions', async () => {
    const llm = FakeLlm.respondingWith(['Just one message.']);
    const { service } = build(llm);

    const result = await service.suggest(INPUT);

    assert.equal(result.source, 'fallback');
    assert.equal(result.suggestions.length, 3);
  });

  // Test 4 — degraded output must not poison the cache.
  it('never caches a fallback response', async () => {
    const llm = FakeLlm.failingWith(new Error('503 from provider'));
    const { service, cache } = build(llm);

    await service.suggest(INPUT);

    assert.equal(cache.writes.length, 0);
  });

  // Test 3 — happy path.
  it('returns model output and caches it', async () => {
    const llm = FakeLlm.respondingWith(VALID_OUTPUT);
    const { service, cache } = build(llm);

    const result = await service.suggest(INPUT);

    assert.equal(result.source, 'llm');
    assert.deepEqual(result.suggestions, VALID_OUTPUT);
    assert.equal(cache.writes.length, 1);
    assert.equal(cache.writes[0]?.key, cacheKey(INPUT));
  });

  // Test 5 — a hit must not cost an API call.
  it('serves from cache without calling the model', async () => {
    const llm = FakeLlm.respondingWith(VALID_OUTPUT);
    const { service, cache } = build(llm);
    cache.seed(cacheKey(INPUT), VALID_OUTPUT);

    const result = await service.suggest(INPUT);

    assert.equal(result.source, 'cache');
    assert.deepEqual(result.suggestions, VALID_OUTPUT);
    assert.equal(llm.calls, 0);
  });

  it('treats equivalent inputs as the same cache entry', async () => {
    const llm = FakeLlm.respondingWith(VALID_OUTPUT);
    const { service, cache } = build(llm);
    cache.seed(cacheKey(INPUT), VALID_OUTPUT);

    const result = await service.suggest({ occasion: '  birthday ', relationship: 'FRIEND' });

    assert.equal(result.source, 'cache');
    assert.equal(llm.calls, 0);
  });

  it('still answers when the cache is down', async () => {
    const llm = FakeLlm.respondingWith(VALID_OUTPUT);
    const { service, cache, logger } = build(llm);
    cache.failOnGet = true;
    cache.failOnSet = true;

    const result = await service.suggest(INPUT);

    assert.equal(result.source, 'llm');
    assert.ok(logger.has('cache_read_failed'));
    assert.ok(logger.has('cache_write_failed'));
  });

  it('ignores cached entries that no longer honour the contract', async () => {
    const llm = FakeLlm.respondingWith(VALID_OUTPUT);
    const { service, cache } = build(llm);
    cache.seed(cacheKey(INPUT), ['only one']);

    const result = await service.suggest(INPUT);

    assert.equal(result.source, 'llm');
    assert.equal(llm.calls, 1);
  });
});
