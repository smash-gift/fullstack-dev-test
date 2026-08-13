import type { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

function isBodyParserSyntaxError(
  err: unknown,
): err is SyntaxError & { status: number; body: unknown } {
  return (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status?: unknown }).status === 400 &&
    "body" in err
  );
}

/**
 * Shape thrown by the `raw-body` package (used internally by body-parser /
 * express.json) when the request body exceeds the configured `limit`.
 */
function isPayloadTooLargeError(
  err: unknown,
): err is Error & { status: number; type: string } {
  return (
    err instanceof Error &&
    (err as { status?: unknown }).status === 413 &&
    (err as { type?: unknown }).type === "entity.too.large"
  );
}

/**
 * Extracts a safe-to-log summary of an error `cause`. Upstream SDKs (e.g. the
 * OpenAI SDK) sometimes attach the outgoing request (headers/config) to their
 * error objects, which can carry the Authorization header with the API key.
 * We only ever log a small allow-list of fields instead of the raw object.
 */
function summarizeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    const { message, name } = cause;
    const status = (cause as { status?: unknown }).status;
    return { name, message, status };
  }

  if (cause && typeof cause === "object") {
    const { message, status } = cause as { message?: unknown; status?: unknown };
    return { message, status };
  }

  return cause;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      // eslint-disable-next-line no-console
      console.error(
        `Server error [${err.code}]:`,
        err.message,
        err.cause !== undefined ? { cause: summarizeCause(err.cause) } : "",
      );
    }

    const body: ErrorResponseBody = {
      error: { code: err.code, message: err.message },
    };
    if (err.details) {
      body.error.details = err.details;
    }
    res.status(err.status).json(body);
    return;
  }

  if (isBodyParserSyntaxError(err)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must be valid JSON.",
      },
    });
    return;
  }

  if (isPayloadTooLargeError(err)) {
    // Expected client error (oversized input), not a server/upstream failure --
    // same reasoning as isBodyParserSyntaxError above: not logged.
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body exceeds the maximum allowed size.",
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
}

export default errorHandler;
