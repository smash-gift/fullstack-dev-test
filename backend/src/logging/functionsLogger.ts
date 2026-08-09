import * as functionsLogging from 'firebase-functions/logger';

import type { Logger } from '../domain/types';

/** Adapts the Cloud Functions logger to the domain's Logger port. */
export const functionsLogger: Logger = {
  info(message, context) {
    functionsLogging.info(message, context ?? {});
  },
  warn(message, context) {
    functionsLogging.warn(message, context ?? {});
  },
  error(message, context) {
    functionsLogging.error(message, context ?? {});
  },
};
