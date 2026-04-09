import { Request, Response } from 'express';
import { getSuggestions } from '../services/suggestions.service';

export async function createSuggestions(req: Request, res: Response) {
  const { occasion, relationship } = req.body;

  if (!occasion || !relationship) {
    return res.status(400).json({ error: 'occasion and relationship are required' });
  }

  try {
    const suggestions = await getSuggestions(occasion, relationship);
    return res.json({ suggestions });
  } catch (caughtError) {
    const error = caughtError as any;
    return res.json({ suggestions: error.suggestions, fallback: true });
  }
}