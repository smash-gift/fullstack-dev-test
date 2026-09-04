declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlation id, set by the requestId middleware on every request. */
      requestId: string;
    }
  }
}

export {};
