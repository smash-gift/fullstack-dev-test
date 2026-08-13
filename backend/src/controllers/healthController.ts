import type { Request, Response } from 'express';

/**
 * Liveness check only: confirms the process is up and responding. Deliberately
 * does not check connectivity to OpenAI or Firebase -- that would make this
 * endpoint's latency/availability depend on external services, which is not
 * what a liveness probe is for.
 */
export function getHealth(req: Request, res: Response): void {
  res.status(200).json({ status: 'ok' });
}

export default { getHealth };
