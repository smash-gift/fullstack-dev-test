import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app.js';

const endpoint = '/api/v1/suggestions';

describe(`POST ${endpoint}`, () => {
  it('returns 3 suggestions for birthday + friend', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ occasion: 'birthday', relationship: 'friend' });

    expect(response.status).toBe(200);
    expect(response.body.data.suggestions).toHaveLength(3);
    expect(response.body.data.source).toBe('llm');
    expect(response.body.data.degraded).toBe(false);
    expect(response.body.data.model).toBe('stub-deterministic-v1');
  });

  it('gives every suggestion a non-empty id and text', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ occasion: 'birthday', relationship: 'friend' });

    for (const suggestion of response.body.data.suggestions) {
      expect(suggestion.id).toMatch(/^sug_/);
      expect(typeof suggestion.text).toBe('string');
      expect(suggestion.text.length).toBeGreaterThan(0);
    }
  });

  it('honours count = 2', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ occasion: 'birthday', relationship: 'friend', count: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data.suggestions).toHaveLength(2);
  });

  it('returns correlation metadata', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ occasion: 'birthday', relationship: 'friend' });

    expect(response.body.meta.requestId).toMatch(/^req_/);
    expect(response.body.meta.cached).toBe(false);
    expect(response.headers['x-request-id']).toBe(response.body.meta.requestId);
  });

  it('accepts free text, not only the suggested values', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ occasion: 'graduation day', relationship: 'my neighbour' });

    expect(response.status).toBe(200);
  });

  it('reports cached: true on an identical second request', async () => {
    const app = buildTestApp({ env: { CACHE_ENABLED: 'true' } });
    const body = { occasion: 'birthday', relationship: 'friend' };

    await request(app).post(endpoint).send(body);
    const second = await request(app).post(endpoint).send(body);

    expect(second.body.meta.cached).toBe(true);
  });
});

describe(`POST ${endpoint} — validation`, () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ['occasion is missing', { relationship: 'friend' }, 'occasion'],
    ['relationship is missing', { occasion: 'birthday' }, 'relationship'],
    ['occasion is too short', { occasion: 'a', relationship: 'friend' }, 'occasion'],
    ['occasion is too long', { occasion: 'x'.repeat(61), relationship: 'friend' }, 'occasion'],
    [
      'count is below the range',
      { occasion: 'birthday', relationship: 'friend', count: 1 },
      'count',
    ],
    [
      'count is above the range',
      { occasion: 'birthday', relationship: 'friend', count: 10 },
      'count',
    ],
    [
      'tone is unknown',
      { occasion: 'birthday', relationship: 'friend', tone: 'sarcastic' },
      'tone',
    ],
    [
      'language is unsupported',
      { occasion: 'birthday', relationship: 'friend', language: 'de' },
      'language',
    ],
  ];

  it.each(cases)('returns 400 when %s', async (_label, body, expectedField) => {
    const response = await request(buildTestApp()).post(endpoint).send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.map((d: { field: string }) => d.field)).toContain(
      expectedField,
    );
  });

  it('returns 400 for an empty body', async () => {
    const response = await request(buildTestApp()).post(endpoint).send({});
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .set('Content-Type', 'application/json')
      .send('{"occasion": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 413 for an oversized body', async () => {
    const response = await request(buildTestApp())
      .post(endpoint)
      .send({ occasion: 'birthday', relationship: 'friend', padding: 'x'.repeat(10_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  // Invalid input is the caller's bug: serving suggestions would hide it.
  it('never falls back for invalid input', async () => {
    const response = await request(buildTestApp()).post(endpoint).send({ occasion: 'birthday' });

    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
  });
});
