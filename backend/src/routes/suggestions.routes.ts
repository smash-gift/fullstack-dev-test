import { Router } from 'express';
import { suggestMessages } from '../controllers/suggestions.controller';

const router = Router();

router.post('/', (req, res, next) => {
  suggestMessages(req, res).catch(next);
});

export default router;
