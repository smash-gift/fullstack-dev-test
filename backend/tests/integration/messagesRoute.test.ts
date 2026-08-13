const mockGenerateMessages = jest.fn();

jest.mock('../../src/services/openaiService', () => ({
  getOpenAiService: () => ({ generateMessages: mockGenerateMessages }),
}));

import request from 'supertest';
import createApp from '../../src/app';

describe('POST /messages', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    mockGenerateMessages.mockReset();
    app = createApp();
  });

  it('returns 200 with 3 messages, cached:false and fallback:false for a fresh generation', async () => {
    mockGenerateMessages.mockResolvedValue({
      messages: ['one', 'two', 'three'],
      cached: false,
      fallback: false,
    });

    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday', relationship: 'mother' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      messages: ['one', 'two', 'three'],
      cached: false,
      fallback: false,
    });
  });

  it('returns 200 with cached:true when the service reports a cache hit', async () => {
    mockGenerateMessages.mockResolvedValue({
      messages: ['one', 'two', 'three'],
      cached: true,
      fallback: false,
    });

    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday', relationship: 'mother' });

    expect(response.status).toBe(200);
    expect(response.body.cached).toBe(true);
  });

  it('returns 200 with fallback:true when the service reports an OpenAI failure', async () => {
    mockGenerateMessages.mockResolvedValue({
      messages: ['fallback one', 'fallback two', 'fallback three'],
      cached: false,
      fallback: true,
    });

    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday', relationship: 'mother' });

    expect(response.status).toBe(200);
    expect(response.body.fallback).toBe(true);
    expect(response.body.messages).toEqual(['fallback one', 'fallback two', 'fallback three']);
  });

  it('forwards regenerate:true to the service when the client requests a fresh generation', async () => {
    mockGenerateMessages.mockResolvedValue({
      messages: ['fresh one', 'fresh two', 'fresh three'],
      cached: false,
      fallback: false,
    });

    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday', relationship: 'mother', regenerate: true });

    expect(response.status).toBe(200);
    expect(mockGenerateMessages).toHaveBeenCalledWith(
      expect.objectContaining({ regenerate: true }),
    );
  });

  it('accepts free-form descriptive text for occasion and relationship', async () => {
    mockGenerateMessages.mockResolvedValue({ messages: ['one', 'two', 'three'], cached: false, fallback: false });

    const response = await request(app)
      .post('/messages')
      .send({
        occasion: '50 anos de casamento dos meus pais, eles adoram viajar juntos',
        relationship: 'meus pais, que sempre me apoiaram em tudo',
      });

    expect(response.status).toBe(200);
  });

  it('returns 400 VALIDATION_ERROR when occasion is missing', async () => {
    const response = await request(app)
      .post('/messages')
      .send({ relationship: 'mother' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockGenerateMessages).not.toHaveBeenCalled();
  });

  it('returns 400 VALIDATION_ERROR when relationship is missing', async () => {
    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when the body is malformed JSON', async () => {
    const response = await request(app)
      .post('/messages')
      .set('Content-Type', 'application/json')
      .send('{ not valid json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 INTERNAL_ERROR for an unexpected error', async () => {
    mockGenerateMessages.mockRejectedValue(new Error('totally unexpected'));

    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday', relationship: 'mother' });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns 413 PAYLOAD_TOO_LARGE when the request body exceeds the configured size limit', async () => {
    const response = await request(app)
      .post('/messages')
      .set('Content-Type', 'application/json')
      .send({
        occasion: 'a'.repeat(20000),
        relationship: 'mother',
      });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(mockGenerateMessages).not.toHaveBeenCalled();
  });

  it('returns 404 NOT_FOUND for unknown routes', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('includes Access-Control-Allow-Origin on a normal POST /messages response', async () => {
    mockGenerateMessages.mockResolvedValue({ messages: ['one', 'two', 'three'], cached: false, fallback: false });

    const response = await request(app)
      .post('/messages')
      .send({ occasion: 'birthday', relationship: 'mother' });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('responds to an OPTIONS preflight for /messages with 204 and CORS headers', async () => {
    const response = await request(app)
      .options('/messages')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(mockGenerateMessages).not.toHaveBeenCalled();
  });
});

describe('POST /messages rate limiting', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    mockGenerateMessages.mockReset();
    mockGenerateMessages.mockResolvedValue({ messages: ['one', 'two', 'three'], cached: false, fallback: false });
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '2';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns 429 RATE_LIMITED after exceeding the configured max requests', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const freshCreateApp = require('../../src/app').default;
    const freshApp = freshCreateApp();

    const payload = { occasion: 'birthday', relationship: 'mother' };

    const first = await request(freshApp).post('/messages').send(payload);
    const second = await request(freshApp).post('/messages').send(payload);
    const third = await request(freshApp).post('/messages').send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
  });
});
