import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app.js';

describe('Swagger UI', () => {
  it('serves the documentation page', async () => {
    const response = await request(buildTestApp()).get('/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('swagger-ui');
  });

  /**
   * Phase 06 disabled CSP because a JSON API renders nothing. This route does,
   * so the policy comes back — scoped here rather than loosened globally.
   */
  it('sets a content security policy on the one page that renders HTML', async () => {
    const response = await request(buildTestApp()).get('/docs');
    const csp = response.headers['content-security-policy'];

    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('leaves the JSON API without a CSP, because it renders nothing', async () => {
    const response = await request(buildTestApp()).get('/health');

    expect(response.headers['content-security-policy']).toBeUndefined();
  });

  /** No inline script is what lets `script-src` stay at `'self'`. */
  it('serves a page with no inline script', async () => {
    const response = await request(buildTestApp()).get('/docs');
    const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i;

    expect(inlineScript.test(response.text)).toBe(false);
  });

  it.each([
    ['/docs/swagger-ui.css', 'text/css'],
    ['/docs/swagger-ui-bundle.js', 'text/javascript'],
    ['/docs/swagger-initializer.js', 'text/javascript'],
    ['/docs/favicon-32x32.png', 'image/png'],
  ])('serves %s', async (path, contentType) => {
    const response = await request(buildTestApp()).get(path);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain(contentType);
  });

  /**
   * The assets are an allowlist, not a static mount of the package directory:
   * otherwise a dependency update would decide what this API exposes.
   */
  it.each([
    '/docs/swagger-ui-bundle.js.map',
    '/docs/package.json',
    '/docs/swagger-ui-es-bundle.js',
    '/docs/oauth2-redirect.html',
  ])('does not serve %s, which is not on the allowlist', async (path) => {
    expect((await request(buildTestApp()).get(path)).status).toBe(404);
  });

  it('points the UI at this API and nowhere else', async () => {
    const response = await request(buildTestApp()).get('/docs/swagger-initializer.js');

    expect(response.text).toContain("url: '/docs/openapi.json'");
    expect(response.text).not.toMatch(/https?:\/\//);
  });

  it('can be switched off for a deployment that does not want to publish it', async () => {
    const app = buildTestApp({ env: { DOCS_ENABLED: 'false' } });

    expect((await request(app).get('/docs')).status).toBe(404);
    expect((await request(app).get('/docs/openapi.json')).status).toBe(404);
    expect(
      (
        await request(app)
          .post('/api/v1/suggestions')
          .send({ occasion: 'birthday', relationship: 'friend' })
      ).status,
    ).toBe(200);
  });
});
