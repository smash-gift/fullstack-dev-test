import { describe, expect, it } from 'vitest';

import { LlmInvalidResponseError } from '../../src/domain/errors/index.js';
import { parseSuggestionsPayload } from '../../src/infra/llm/parsing/llm-response.schema.js';

const payload = (suggestions: unknown) => JSON.stringify({ suggestions });

describe('parseSuggestionsPayload', () => {
  it('turns a valid payload into suggestions', () => {
    const result = parseSuggestionsPayload(payload(['One.', 'Two.', 'Three.']), 3);

    expect(result).toHaveLength(3);
    expect(result[0]?.text).toBe('One.');
    expect(result[0]?.id).toMatch(/^sug_/);
  });

  it('gives every suggestion a distinct id', () => {
    const result = parseSuggestionsPayload(payload(['One.', 'Two.']), 2);
    expect(new Set(result.map((s) => s.id)).size).toBe(2);
  });

  it('trims surrounding whitespace', () => {
    const result = parseSuggestionsPayload(payload(['  Padded.  ', 'Two.']), 2);
    expect(result[0]?.text).toBe('Padded.');
  });

  // Some models wrap JSON in a fence despite being told not to. One recovery
  // attempt is pragmatic; more would be guessing.
  it('recovers a payload wrapped in a markdown fence', () => {
    const fenced = '```json\n{"suggestions":["One.","Two."]}\n```';
    expect(parseSuggestionsPayload(fenced, 2)).toHaveLength(2);
  });
});

/**
 * A 200 OK carrying unusable content is a failure, not a success. These are
 * the cases that make that true in code.
 */
describe('parseSuggestionsPayload — rejections', () => {
  const cases: Array<[string, string, number]> = [
    ['the text is not JSON', 'Sure! Here are some ideas: ...', 3],
    ['the payload is an empty object', '{}', 3],
    ['suggestions is not an array', payload('One.'), 3],
    ['a suggestion is not a string', payload([1, 2, 3]), 3],
    ['a suggestion is empty', payload(['', 'Two.']), 2],
    ['a suggestion is whitespace only', payload(['   ', 'Two.']), 2],
    ['a suggestion exceeds the length cap', payload(['x'.repeat(241), 'Two.']), 2],
    ['there are fewer suggestions than the minimum', payload(['One.']), 1],
    ['there are more suggestions than the maximum', payload(['1', '2', '3', '4']), 4],
    ['the count does not match the request', payload(['One.', 'Two.']), 3],
  ];

  it.each(cases)('rejects when %s', (_label, raw, count) => {
    expect(() => parseSuggestionsPayload(raw, count)).toThrow(LlmInvalidResponseError);
  });

  it('explains the mismatch when the count is wrong', () => {
    expect(() => parseSuggestionsPayload(payload(['One.', 'Two.']), 3)).toThrow(
      /returned 2 suggestions, expected 3/,
    );
  });
});
