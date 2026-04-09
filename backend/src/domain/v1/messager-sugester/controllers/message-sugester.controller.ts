import type { Request, Response, NextFunction } from 'express';
import { type MessageSugesterService } from '../services/message-sugester.service';
import { ValidationError } from '../../../../utils/errors';

export class MessagerSugesterController {
  private service: MessageSugesterService;

  constructor(service: MessageSugesterService) {
    this.service = service;
  }

  suggestMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { occasion, relationship } = req.body;

      // Sanitização e Validação
      const sanitizedOccasion = typeof occasion === 'string' ? occasion.trim() : '';
      const sanitizedRelationship = typeof relationship === 'string' ? relationship.trim() : '';

      if (!sanitizedOccasion || !sanitizedRelationship) {
        throw new ValidationError('Os campos "occasion" e "relationship" são obrigatórios e não podem conter apenas espaços.');
      }

      console.info('[MessagerSugesterController] - Request received:', { 
        occasion: sanitizedOccasion, 
        relationship: sanitizedRelationship 
      });

      const response = await this.service.suggestMessage(sanitizedOccasion, sanitizedRelationship);

      res.status(200).json(response);
    } catch (error) {
      console.error('[MessageSugesterController] - Error suggesting message:', error);
      next(error);
    }
  };
}
