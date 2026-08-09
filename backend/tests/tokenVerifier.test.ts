import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { bearerToken } from '../src/auth/tokenVerifier';

describe('bearerToken', () => {
  it('reads the token out of a well-formed header', () => {
    assert.equal(bearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  });

  it('accepts any casing of the scheme', () => {
    assert.equal(bearerToken('bearer abc'), 'abc');
    assert.equal(bearerToken('BEARER abc'), 'abc');
  });

  it('takes the first value when the header arrived more than once', () => {
    assert.equal(bearerToken(['Bearer abc', 'Bearer xyz']), 'abc');
  });

  it('returns nothing for anything malformed', () => {
    assert.equal(bearerToken(undefined), undefined);
    assert.equal(bearerToken(''), undefined);
    assert.equal(bearerToken('abc.def.ghi'), undefined, 'no scheme');
    assert.equal(bearerToken('Token abc'), undefined, 'wrong scheme');
    assert.equal(bearerToken('Bearer'), undefined, 'no token');
    assert.equal(bearerToken('Bearer   '), undefined, 'blank token');
  });
});
