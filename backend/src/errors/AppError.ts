export interface AppErrorOptions {
  status: number;
  code: string;
  message: string;
  details?: string[];
  cause?: unknown;
}

export class AppError extends Error {
  status: number;

  code: string;

  details?: string[];

  cause?: unknown;

  constructor({ status, code, message, details, cause }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    if (cause) {
      this.cause = cause;
    }
    Error.captureStackTrace?.(this, AppError);
  }
}

export default AppError;
