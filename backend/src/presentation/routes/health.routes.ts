import { Router } from 'express';

export interface HealthInfo {
  readonly version: string;
  readonly llmProvider: string;
}

/**
 * Liveness endpoint.
 *
 * Deliberately does not check the LLM provider: a health check that depends
 * on a third party makes the orchestrator restart a healthy service during
 * someone else's incident — and this system is designed to keep serving,
 * degraded, in exactly that situation.
 */
export function healthRoutes(info: HealthInfo): Router {
  const router = Router();
  const startedAt = Date.now();

  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      version: info.version,
      llmProvider: info.llmProvider,
    });
  });

  return router;
}
