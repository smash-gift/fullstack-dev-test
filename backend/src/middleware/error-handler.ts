import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Se for um erro conhecido (AppError), usamos o status code dele
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors }),
    });
  }

  // Log de erros inesperados (não operacionais)
  console.error('[InternalError] - Unexpected error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Em produção, não vazamos detalhes do erro para o cliente
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(500).json({
    status: "error",
    message,
  });
};

// Wrapper para capturar erros em funções assíncronas (útil se não usar arrow functions ou classes com bind)
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
