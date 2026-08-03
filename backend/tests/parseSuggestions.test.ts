import { parseSuggestions, mapOpenAiError } from '../src/llm/openai.provider';
import { LlmError } from '../src/llm/llm.provider';

describe('parseSuggestions', () => {
  it('parses a valid JSON envelope and trims/limits to 3', () => {
    const raw = JSON.stringify({
      suggestions: ['  A  ', 'B', 'C', 'D (extra)'],
    });
    expect(parseSuggestions(raw)).toEqual(['A', 'B', 'C']);
  });

  it('throws invalid_output on non-JSON', () => {
    expect(() => parseSuggestions('not json')).toThrow(LlmError);
  });

  it('throws invalid_output when suggestions is missing', () => {
    expect(() => parseSuggestions(JSON.stringify({ foo: 'bar' }))).toThrow(/suggestions/);
  });

  it('throws invalid_output when fewer than 2 usable items', () => {
    expect(() => parseSuggestions(JSON.stringify({ suggestions: ['only one'] }))).toThrow(LlmError);
  });
});

describe('mapOpenAiError', () => {
  it('maps aborts to timeout', () => {
    expect(mapOpenAiError({ name: 'AbortError' }).kind).toBe('timeout');
  });
  it('maps 429 to rate_limited', () => {
    expect(mapOpenAiError({ status: 429 }).kind).toBe('rate_limited');
  });
  it('maps 5xx to upstream', () => {
    expect(mapOpenAiError({ status: 503 }).kind).toBe('upstream');
  });
  it('passes through existing LlmError', () => {
    const e = new LlmError('invalid_output', 'x');
    expect(mapOpenAiError(e)).toBe(e);
  });
});
