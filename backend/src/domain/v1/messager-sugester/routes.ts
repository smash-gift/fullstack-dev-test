import { Router } from 'express';
import { MessagerSugesterController } from './controllers/message-sugester.controller';
import { MessageSugesterService } from './services/message-sugester.service';
import { GeminiAdapter } from '../../../integrations/ai/gemini.adapter';
import * as dotenv from 'dotenv';

dotenv.config();

export const messagerSugester = Router();

const geminiAdapter = new GeminiAdapter(
  process.env.GEMINI_MODEL_NAME!,
  process.env.GEMINI_API_KEY!,
);
const messageSugerterService = new MessageSugesterService(geminiAdapter);
const messageSugerterController = new MessagerSugesterController(messageSugerterService);

messagerSugester.post('/messager-sugester', messageSugerterController.suggestMessage);
