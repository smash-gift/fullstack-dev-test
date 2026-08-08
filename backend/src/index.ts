import { onRequest } from 'firebase-functions/v2/https';

/**
 * HTTP entry point. Stage 0 only proves the function loads in the emulator;
 * the real handler is wired in stage 2.
 */
export const suggestions = onRequest((_req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet.' },
  });
});
