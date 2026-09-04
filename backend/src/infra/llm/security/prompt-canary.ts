import { randomBytes } from 'node:crypto';

/**
 * A token planted in the system prompt that the model is told never to reveal.
 *
 * The model has no legitimate reason to emit it. So if it ever appears in a
 * completion, that is not a suspicion — it is PROOF that the model is
 * regurgitating its own system prompt, which means an injection succeeded.
 *
 * Generated once per process and never persisted: a canary committed to the
 * repository would be a known value an attacker could search for, and one
 * reused across deploys would eventually leak into a log somewhere.
 *
 * See docs/05-security/llm-security.md, layer 2.
 */
export const PROMPT_CANARY = `CANARY-${randomBytes(8).toString('hex')}`;

/**
 * Case-insensitive so that a model paraphrasing the token in a different case
 * still trips the detector.
 */
export function containsCanary(text: string): boolean {
  return text.toLowerCase().includes(PROMPT_CANARY.toLowerCase());
}
