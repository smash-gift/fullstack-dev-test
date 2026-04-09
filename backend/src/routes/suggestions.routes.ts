import { Router } from 'express';
import { createSuggestions } from '../controllers/suggestions.controller';

const router = Router();

router.post('/', createSuggestions);

export default router;