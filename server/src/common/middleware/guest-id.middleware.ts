import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class GuestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const guestId = req.headers['x-guest-id'] as string;

    if (!guestId) {
      throw new BadRequestException('Header X-Guest-ID is required (RN02).');
    }

    if (!UUID_V4_REGEX.test(guestId)) {
      throw new BadRequestException(
        'Header X-Guest-ID must be a valid UUID v4 (RN02).',
      );
    }

    next();
  }
}
