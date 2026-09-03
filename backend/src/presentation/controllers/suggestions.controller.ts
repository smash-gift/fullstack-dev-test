import type { Request, Response } from 'express';

import type {
  SuggestMessagesInput,
  SuggestionCount,
} from '../../domain/dtos/suggest-messages-input.dto.js';
import { ValidationError, type ValidationIssue } from '../../domain/errors/index.js';
import type { SuggestMessagesUseCase } from '../../domain/usecases/suggest-messages.usecase.js';
import { success } from '../../pkg/response/http-response.js';
import { suggestMessagesBodySchema } from '../validators/suggestions.schema.js';

export class SuggestionsController {
  constructor(private readonly useCase: SuggestMessagesUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const input = this.parseBody(req.body);
    const result = await this.useCase.execute(input);

    res.status(200).json(
      success(
        {
          suggestions: result.suggestions,
          source: result.source,
          model: result.model,
          degraded: result.degraded,
        },
        {
          requestId: req.requestId,
          generatedAt: new Date().toISOString(),
          cached: result.cached,
          ...(result.reason ? { reason: result.reason } : {}),
        },
      ),
    );
  };

  private parseBody(body: unknown): SuggestMessagesInput {
    const parsed = suggestMessagesBodySchema.safeParse(body ?? {});

    if (!parsed.success) {
      const issues: ValidationIssue[] = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(body)',
        issue: issue.message,
      }));
      throw new ValidationError('Invalid request body', issues);
    }

    return { ...parsed.data, count: parsed.data.count as SuggestionCount };
  }
}
