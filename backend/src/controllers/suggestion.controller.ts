import { NextFunction, Request, Response } from 'express';
import { SuggestionService } from '../services/suggestion.service';
import { suggestionSchema } from './suggestion.schema';

/**
 * HTTP boundary for the suggestion feature. Keeps Express types out of the
 * service and translates between HTTP and the domain.
 */
export class SuggestionController {
  constructor(private readonly service: SuggestionService) {}

  // Bound arrow method so it can be passed directly as a route handler.
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = suggestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'invalid_request',
        message: 'Please provide a valid occasion and relationship.',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    try {
      const result = await this.service.getSuggestions(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      // The service is designed not to throw for this flow, but if something
      // truly unexpected happens, hand off to the central error handler which
      // returns a safe generic message.
      next(err);
    }
  };
}
