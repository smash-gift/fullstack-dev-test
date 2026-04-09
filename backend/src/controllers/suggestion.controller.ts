import { Request, Response } from "express";
import { ZodError } from "zod";
import * as suggestionService from "../services/suggestion.service";

export async function handleSuggestion(req: Request, res: Response) {
  try {
    const { occasion, relationship } = req.body;

    const result = await suggestionService.execute({
      occasion,
      relationship,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: error.flatten(),
      });
    }

    return res.status(500).json({
      message: "Unexpected server error",
    });
  }
}