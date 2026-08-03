import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter';
import suggestionsRouter from './routes/suggestions.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/suggestions', rateLimiter, suggestionsRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', provider: process.env.AI_PROVIDER ?? 'gemini' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
