import type { Request, Response, NextFunction } from 'express';
import { validateMessagesRequest } from '../validators/messagesValidator';
import { getOpenAiService } from '../services/openaiService';
import AppError from '../errors/AppError';

export async function postMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  const validation = validateMessagesRequest(req.body);

  if (!validation.valid) {
    next(new AppError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body.',
      details: validation.errors,
    }));
    return;
  }

  try {
    const service = getOpenAiService();
    const result = await service.generateMessages(validation.data);
    res.status(200).json(result);
  } catch (err) {
    // generateMessages never rejects for an OpenAI failure (it resolves to a fallback 200
    // instead) -- this only catches genuinely unexpected errors, e.g. a bug in the service.
    next(err);
  }
}

export default { postMessages };
