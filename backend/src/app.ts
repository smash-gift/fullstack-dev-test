import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import messagesRouter from "./routes/messagesRouter";
import healthRouter from "./routes/healthRouter";
import errorHandler from "./middleware/errorHandler";
import createCorsMiddleware from "./middleware/cors";
import AppError from "./errors/AppError";
import { getEnv } from "./config/env";

// Valid request bodies (occasion + relationship, 300 chars each) are at most a
// few hundred bytes even with JSON overhead. 10kb gives comfortable margin for
// that without leaving the door open to oversized payloads.
const JSON_BODY_LIMIT = "10kb";

export function createApp(): Express {
  const app = express();
  const env = getEnv();

  app.use(createCorsMiddleware({ origin: env.corsOrigin }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use("/health", healthRouter);
  app.use("/messages", messagesRouter);

  app.use((req: Request, res: Response, next: NextFunction) => {
    next(
      new AppError({
        status: 404,
        code: "NOT_FOUND",
        message: `Route not found: ${req.method} ${req.originalUrl}`,
      }),
    );
  });

  app.use(errorHandler);

  return app;
}

export default createApp;
