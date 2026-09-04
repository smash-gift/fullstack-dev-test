export interface ResponseMeta {
  readonly requestId: string;
  readonly [key: string]: unknown;
}

export interface SuccessBody<T> {
  readonly data: T;
  readonly meta: ResponseMeta;
}

export interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly meta: ResponseMeta;
}

export function success<T>(data: T, meta: ResponseMeta): SuccessBody<T> {
  return { data, meta };
}

export function failure(
  code: string,
  message: string,
  meta: ResponseMeta,
  details?: unknown,
): ErrorBody {
  return {
    error: details === undefined ? { code, message } : { code, message, details },
    meta,
  };
}
