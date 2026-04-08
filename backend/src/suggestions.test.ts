import request from 'supertest';
import express from 'express';
import suggestionsRouter from './suggestions';

// Mock do LLM para forçar o fallback
jest.mock('./llm', () => ({
  getSuggestions: jest.fn(() => {
    const err: any = new Error('LLM unavailable, using fallback');
    err.suggestions = ['Fallback 1', 'Fallback 2'];
    throw err;
  }),
}));

const app = express();
app.use(express.json());
app.use('/suggestions', suggestionsRouter);

describe('POST /suggestions (fallback)', () => {
  it('deve retornar sugestões alternativas quando o LLM falhar', async () => {
    const res = await request(app)
      .post('/suggestions')
      .send({ occasion: 'aniversario', relationship: 'amigo' });
    expect(res.body.suggestions).toEqual(['Fallback 1', 'Fallback 2']);
    expect(res.body.fallback).toBe(true);
  });
});
