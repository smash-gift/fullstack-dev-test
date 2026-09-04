import type { Express } from 'express';
import type { Server } from 'node:http';
import request from 'supertest';

/**
 * One listening server per app, instead of one per request.
 *
 * `request(app)` makes supertest start an ephemeral server and close it when
 * the response ends. The corpus suite alone does that around two hundred times
 * in half a second, and the churn is not free: roughly one full run in ten came
 * back with a `403` on a route that answers `400`, a `404` on a route that
 * answers `200`, or a bare `ECONNRESET`. A `403` is the tell - this API never
 * returns one, so the answer came from a server that is not ours.
 *
 * Supertest leaves a server it did not start alone, so binding once per app and
 * closing at the end of the file removes the churn instead of hoping past it.
 */
const servers = new Map<Express, Server>();

export function req(app: Express): ReturnType<typeof request> {
  let server = servers.get(app);

  if (!server) {
    server = app.listen(0);
    servers.set(app, server);
  }

  return request(server);
}

/** Registered by the setup file, and run at the end of every test file. */
export async function closeTestServers(): Promise<void> {
  const closing = [...servers.values()].map(
    (server) =>
      new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      }),
  );

  servers.clear();
  await Promise.all(closing);
}
