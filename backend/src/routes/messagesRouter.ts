import { Router } from 'express';
import createRateLimiter from '../middleware/rateLimiter';
import { getEnv } from '../config/env';
import messagesController from '../controllers/messagesController';

const router = Router();
const env = getEnv();
const limiter = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
});

router.post('/', limiter, messagesController.postMessages);

export default router;
