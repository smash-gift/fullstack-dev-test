import { Router } from 'express';
import { getSuggestions } from './llm';

const router = Router();

router.post('/', async (req, res) => {
  const { occasion, relationship } = req.body;
  if (!occasion || !relationship) {
    return res.status(400).json({ error: 'occasion and relationship are required' });
  }
  try {
    const suggestions = await getSuggestions(occasion, relationship);
    res.json({ suggestions });
  } catch (error) {
    // fallback handled in getSuggestions
    const err = error as any;
    res.json({ suggestions: err.suggestions, fallback: true });
  }
});

export default router;
