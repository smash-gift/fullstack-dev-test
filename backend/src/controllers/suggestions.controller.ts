import { Request, Response, NextFunction } from "express";
import { getSuggestions } from "../services/suggestions.service";
import { AppError } from "../errors/app.error";

export async function suggestionsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { occasion, relationship } = req.body;

    if (!occasion || !relationship) {
      throw new AppError(
        "Os campos 'occasion' e 'relationship' são obrigatórios.",
        400
      );
    }

    const result = await getSuggestions(occasion, relationship);
    res.json(result);
  } catch (error) {
    next(error);
  }
}