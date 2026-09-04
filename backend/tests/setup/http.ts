import http from 'node:http';
import https from 'node:https';

import { afterAll } from 'vitest';

import { closeTestServers } from '../helpers/http-client.js';

/**
 * Node 19 turned on `keepAlive` for the global agent, so a pooled socket can
 * outlive the ephemeral server it was opened to and answer from whatever the
 * OS handed that port to next. Tests assert on the app, not on socket pooling.
 */
http.globalAgent = new http.Agent({ keepAlive: false });
https.globalAgent = new https.Agent({ keepAlive: false });

afterAll(closeTestServers);
