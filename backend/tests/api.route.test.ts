import request from 'supertest';
import { LlmProvider } from '../src/llm/llm.provider';

/**
 * Mock the LLM factory so the HTTP layer is exercised end-to-end without any
 * network call. `mockProvider` is mutated per-test to simulate success/failure.
 */
const mockProvider: LlmProvider = {
  name: 'mock',
  generateSuggestions: jest.fn(),
};

jest.mock('../src/llm/llm.factory', () => ({
  createLlmProvider: () => mockProvider,
}));

// Imported after the mock is registered.
import { createApp } from '../src/app';

const app = createApp();

describe('POST /api/suggestions', () => {
  it('returns 200 with LLM suggestions on the happy path', async () => {
    (mockProvider.generateSuggestions as jest.Mock).mockResolvedValueOnce([
      'Happy birthday, dear friend!',
      'Wishing you the happiest of days.',
    ]);

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'Birthday', relationship: 'Friend' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('llm');
    expect(res.body.degraded).toBe(false);
    expect(res.body.suggestions).toHaveLength(2);
  });

  it('returns 200 with a safe fallback (no raw error) when the LLM fails', async () => {
    (mockProvider.generateSuggestions as jest.Mock).mockRejectedValueOnce(
      new Error('boom: apikey=sk-secret'),
    );

    const res = await request(app)
      .post('/api/suggestions')
      .send({ occasion: 'Wedding', relationship: 'Colleague' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('fallback');
    expect(res.body.degraded).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThanOrEqual(2);
    // The raw error / secret must never leak to the client.
    expect(JSON.stringify(res.body)).not.toMatch(/boom|sk-secret|apikey/i);
  });

  it('returns 400 on invalid input', async () => {
    const res = await request(app).post('/api/suggestions').send({ occasion: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('health check responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
