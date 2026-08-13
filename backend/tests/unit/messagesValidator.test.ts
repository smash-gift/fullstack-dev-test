import { validateMessagesRequest, MAX_FIELD_LENGTH } from '../../src/validators/messagesValidator';

describe('validateMessagesRequest', () => {
  it('accepts a valid body and returns trimmed data', () => {
    const result = validateMessagesRequest({ occasion: '  birthday  ', relationship: ' mother ' });

    expect(result.valid).toBe(true);
    expect(result.valid && result.data).toEqual({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: false,
    });
  });

  it('ignores unknown extra fields when valid', () => {
    const result = validateMessagesRequest({
      occasion: 'birthday',
      relationship: 'mother',
      somethingElse: 'ignored',
    });

    expect(result.valid).toBe(true);
    expect(result.valid && result.data).toEqual({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: false,
    });
  });

  it('sets regenerate:true when the body explicitly requests it', () => {
    const result = validateMessagesRequest({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: true,
    });

    expect(result.valid).toBe(true);
    expect(result.valid && result.data.regenerate).toBe(true);
  });

  it('defaults regenerate to false when absent from the body', () => {
    const result = validateMessagesRequest({ occasion: 'birthday', relationship: 'mother' });

    expect(result.valid).toBe(true);
    expect(result.valid && result.data.regenerate).toBe(false);
  });

  it('defaults regenerate to false when explicitly null or undefined', () => {
    const nullResult = validateMessagesRequest({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: null,
    });
    const undefinedResult = validateMessagesRequest({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: undefined,
    });

    expect(nullResult.valid && nullResult.data.regenerate).toBe(false);
    expect(undefinedResult.valid && undefinedResult.data.regenerate).toBe(false);
  });

  it('rejects a non-boolean regenerate value', () => {
    const result = validateMessagesRequest({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: 'true',
    });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('regenerate')]),
    );
  });

  it('rejects a missing body', () => {
    const result = validateMessagesRequest(undefined);

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('occasion'),
        expect.stringContaining('relationship'),
      ]),
    );
  });

  it('rejects when occasion is missing', () => {
    const result = validateMessagesRequest({ relationship: 'mother' });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('occasion')]),
    );
  });

  it('rejects when relationship is missing', () => {
    const result = validateMessagesRequest({ occasion: 'birthday' });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('relationship')]),
    );
  });

  it('rejects non-string occasion', () => {
    const result = validateMessagesRequest({ occasion: 123, relationship: 'mother' });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('occasion')]),
    );
  });

  it('rejects whitespace-only relationship', () => {
    const result = validateMessagesRequest({ occasion: 'birthday', relationship: '   ' });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('relationship')]),
    );
  });

  it('accepts a realistic free-form occasion/relationship description', () => {
    const result = validateMessagesRequest({
      occasion: '50 anos de casamento dos meus pais, eles adoram viajar juntos',
      relationship: 'meus pais, que sempre me apoiaram em tudo',
    });

    expect(result.valid).toBe(true);
  });

  it(`rejects fields longer than ${MAX_FIELD_LENGTH} characters`, () => {
    const result = validateMessagesRequest({
      occasion: 'a'.repeat(MAX_FIELD_LENGTH + 1),
      relationship: 'mother',
    });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('occasion')]),
    );
  });

  it(`accepts fields exactly at the ${MAX_FIELD_LENGTH} character boundary`, () => {
    const result = validateMessagesRequest({
      occasion: 'a'.repeat(MAX_FIELD_LENGTH),
      relationship: 'mother',
    });

    expect(result.valid).toBe(true);
  });
});
