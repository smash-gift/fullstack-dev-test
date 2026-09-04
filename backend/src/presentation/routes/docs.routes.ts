import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Router } from 'express';
import helmet from 'helmet';
import swaggerUiDist from 'swagger-ui-dist';

/**
 * The only files from `swagger-ui-dist` this API is willing to serve.
 *
 * An allowlist rather than `express.static` on the package directory: that
 * directory also holds source maps and future files nobody has reviewed, and
 * serving a whole `node_modules` folder means a package update decides what
 * this API exposes. Here a new file is served only when someone adds it.
 */
const ASSETS: Readonly<Record<string, string>> = {
  'swagger-ui.css': 'text/css; charset=utf-8',
  'swagger-ui-bundle.js': 'text/javascript; charset=utf-8',
  'favicon-32x32.png': 'image/png',
};

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gift Card Message Suggester &mdash; API</title>
<link rel="icon" type="image/png" sizes="32x32" href="/docs/favicon-32x32.png">
<link rel="stylesheet" href="/docs/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="/docs/swagger-ui-bundle.js"></script>
<script src="/docs/swagger-initializer.js"></script>
</body>
</html>
`;

const INITIALIZER = `window.ui = SwaggerUIBundle({
  url: '/docs/openapi.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  presets: [SwaggerUIBundle.presets.apis],
  layout: 'BaseLayout',
  tryItOutEnabled: true,
});
`;

/**
 * Content Security Policy for the one HTML page this API serves.
 *
 * Phase 06 turned CSP off because a JSON API returns nothing a browser
 * renders. That stopped being true here, so the policy comes back — scoped to
 * this route, and written tightly rather than left at a default.
 *
 * The page and its initialiser are our own files, not inline scripts, which is
 * what lets `script-src` stay at `'self'`. `style-src` needs `'unsafe-inline'`
 * because Swagger UI injects style attributes at runtime; that is a real
 * loosening, and it is confined to a page whose entire content we wrote.
 */
const docsCsp = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    'default-src': ["'none'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    // Same origin only: "Try it out" calls this very API and nothing else.
    'connect-src': ["'self'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-ancestors': ["'none'"],
  },
});

/**
 * Swagger UI, served from files this project ships.
 *
 * Serving the assets ourselves instead of pulling them from a CDN keeps `/docs`
 * working with no network, and keeps `script-src` at `'self'` — a CDN would
 * have meant allowlisting someone else's origin on our own page.
 */
export function docsRoutes(document: Record<string, unknown>): Router {
  const router = Router();
  const distPath = swaggerUiDist.getAbsoluteFSPath();

  router.use(docsCsp);

  router.get('/openapi.json', (_req, res) => {
    res.json(document);
  });

  router.get('/', (_req, res) => {
    res.type('html').send(PAGE);
  });

  router.get('/swagger-initializer.js', (_req, res) => {
    res.type('js').send(INITIALIZER);
  });

  // Read once at startup rather than streamed from disk per request. Two
  // reasons: the request path stops doing file I/O for bytes that cannot
  // change, and a missing or renamed asset fails loudly when the process
  // starts instead of turning into a 404 the first time someone opens /docs.
  for (const [asset, contentType] of Object.entries(ASSETS)) {
    const content = readFileSync(join(distPath, asset));

    router.get(`/${asset}`, (_req, res) => {
      // Immutable because the version is pinned in package.json: this exact
      // byte sequence never changes without a dependency bump.
      res.set('Cache-Control', 'public, max-age=86400, immutable');
      res.type(contentType).send(content);
    });
  }

  return router;
}
