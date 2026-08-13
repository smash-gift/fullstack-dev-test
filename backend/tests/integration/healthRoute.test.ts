import request from 'supertest';
import createApp from '../../src/app';

describe('GET /health', () => {
  it('returns 200 with a simple ok status body, without requiring authentication', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('does not require any request body or query params', async () => {
    const app = createApp();

    const response = await request(app).get('/health').send();

    expect(response.status).toBe(200);
  });
});
