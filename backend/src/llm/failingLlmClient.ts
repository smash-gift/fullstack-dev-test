import type { LlmClient } from '../domain/types';
import { LlmForcedFailureError } from './errors';

/**
 * Stands in for the real client when FORCE_LLM_FAILURE is set, or when no API
 * key is configured.
 *
 * It exists so the fallback path can be seen in the running app without
 * breaking a working key, and so a reviewer without credit still gets a service
 * that answers instead of one that refuses to start.
 */
export class FailingLlmClient implements LlmClient {
  constructor(private readonly reason: string) {}

  async generate(): Promise<string[]> {
    throw new LlmForcedFailureError(this.reason);
  }
}
