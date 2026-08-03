import request from 'supertest';
import app from '../src/app';
import * as llmService from '../src/services/llm.service';
import { cache } from '../src/controllers/suggestions.controller';

jest.mock('../src/services/llm.service');

const mockedGetSuggestions = jest.mocked(llmService.getSuggestions);

describe('POST /api/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
  });

  it('returns suggestions from LLM on success', async () => {
    const mockSuggestions = [
      'Happy birthday! Hope your day is amazing.',
      'Wishing you a wonderful birthday filled with joy!',
      'Sending lots of love on your special day!',
    ];
    mockedGetSuggestions.mockResolvedValueOnce(mockSuggestions);

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'birthday', relationship: 'friend' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('llm');
    expect(res.body.suggestions).toEqual(mockSuggestions);
    expect(mockedGetSuggestions).toHaveBeenCalledWith('birthday', 'friend');
  });

  it('returns fallback when LLM throws an error', async () => {
    mockedGetSuggestions.mockRejectedValueOnce(new Error('LLM timeout'));

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'birthday', relationship: 'friend' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('fallback');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('does not expose LLM error details in fallback response', async () => {
    mockedGetSuggestions.mockRejectedValueOnce(new Error('API key invalid: sk-secret-key'));

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'thank you', relationship: 'parent' });

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('sk-secret-key');
    expect(body).not.toContain('API key invalid');
  });

  it('returns fallback for unknown occasion when LLM fails', async () => {
    mockedGetSuggestions.mockRejectedValueOnce(new Error('rate limit'));

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'retirement', relationship: 'colleague' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('fallback');
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('returns cached result on second identical request (cache hit)', async () => {
    const mockSuggestions = ['msg1', 'msg2', 'msg3'];
    mockedGetSuggestions.mockResolvedValue(mockSuggestions);

    const first = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'wedding', relationship: 'colleague' });

    expect(first.body.source).toBe('llm');

    const second = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'wedding', relationship: 'colleague' });

    expect(second.status).toBe(200);
    expect(second.body.source).toBe('cache');
    expect(mockedGetSuggestions).toHaveBeenCalledTimes(1);
  });

  it('treats cache key as case-insensitive', async () => {
    const mockSuggestions = ['msg1', 'msg2', 'msg3'];
    mockedGetSuggestions.mockResolvedValue(mockSuggestions);

    await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'Birthday', relationship: 'Friend' });

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'birthday', relationship: 'friend' });

    expect(res.body.source).toBe('cache');
    expect(mockedGetSuggestions).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when occasion is missing', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ relationship: 'friend' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
    expect(res.body.details).toBeDefined();
  });

  it('returns 400 when relationship is missing', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'birthday' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 400 when fields are empty strings', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: '', relationship: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });
});
