import { describe, expect, it } from 'vitest';
import { guardSuggestions } from '../src/application/output-guard.js';
import { UpstreamFailure } from '../src/domain/errors.js';

const options = { canary: 'abc123canary', expected: 3 };

describe('guardSuggestions', () => {
  it('should accept well formed suggestions', () => {
    const result = guardSuggestions(['Happy birthday!', 'Have a great day.', 'Enjoy it.'], options);

    expect(result).toEqual([
      { id: 's1', text: 'Happy birthday!' },
      { id: 's2', text: 'Have a great day.' },
      { id: 's3', text: 'Enjoy it.' },
    ]);
  });

  it('should reject output that leaks the canary', () => {
    const output = ['Happy birthday!', 'Token is abc123canary', 'Enjoy it.'];

    expect(() => guardSuggestions(output, options)).toThrowError(UpstreamFailure);
  });

  it('should reject output longer than two sentences', () => {
    const output = ['One. Two. Three.', 'Have a great day.', 'Enjoy it.'];

    expect(() => guardSuggestions(output, options)).toThrowError(/two sentences/);
  });

  it('should reject output containing links', () => {
    const output = ['Happy birthday!', 'See https://example.com', 'Enjoy it.'];

    expect(() => guardSuggestions(output, options)).toThrowError(/disallowed content/);
  });

  it('should reject duplicated suggestions', () => {
    const output = ['Happy birthday!', 'Happy birthday!', 'Enjoy it.'];

    expect(() => guardSuggestions(output, options)).toThrowError(/duplicate/);
  });

  it('should reject a response that is not a list', () => {
    expect(() => guardSuggestions({ suggestions: 'nope' }, options)).toThrowError(/list/);
  });

  it('should reject fewer suggestions than requested', () => {
    expect(() => guardSuggestions(['Only one.'], options)).toThrowError(/expected 3/);
  });
});
