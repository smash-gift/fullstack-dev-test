import express from 'express';
import cors from 'cors';
import suggestionsRouter from './routes/suggestions.routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/suggestions', suggestionsRouter);

  app.get('/', (_req, res) => {
    res.send('Gift Card Message Suggestion API');
  });

  return app;
}