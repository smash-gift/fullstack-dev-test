import { MockLlmProvider } from '../src/llm/mock.provider';

describe('MockLlmProvider', () => {
  const provider = new MockLlmProvider();

  it('returns three non-empty, on-topic suggestions', async () => {
    const out = await provider.generateSuggestions({
      occasion: 'Birthday',
      relationship: 'Friend',
    });

    expect(out).toHaveLength(3);
    expect(out.every((s) => s.trim().length > 0)).toBe(true);
    // Every message should reference the occasion and mention the relationship.
    expect(out.every((s) => s.toLowerCase().includes('birthday'))).toBe(true);
    expect(out.some((s) => s.toLowerCase().includes('friend'))).toBe(true);
  });

  it('is deterministic for identical input (cache-friendly)', async () => {
    const input = { occasion: 'Wedding', relationship: 'Colleague' };
    const a = await provider.generateSuggestions(input);
    const b = await provider.generateSuggestions(input);
    expect(a).toEqual(b);
  });

  it('varies the wording across different inputs', async () => {
    const a = await provider.generateSuggestions({ occasion: 'Birthday', relationship: 'Friend' });
    const b = await provider.generateSuggestions({
      occasion: 'Graduation',
      relationship: 'Sibling',
    });
    expect(a).not.toEqual(b);
  });

  it('reflects the optional tone in the output', async () => {
    const out = await provider.generateSuggestions({
      occasion: 'Anniversary',
      relationship: 'Partner',
      tone: 'romantic',
    });
    expect(out.some((s) => s.toLowerCase().includes('romantic'))).toBe(true);
  });
});
