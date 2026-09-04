import { randomBytes } from 'node:crypto';

/**
 * Short prefixed identifier, e.g. `req_9f3a2c8b1d4e6071`.
 *
 * Not a UUID: these ids are short-lived correlation handles, never persisted
 * and never used as security tokens.
 */
export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}
