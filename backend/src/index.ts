import express, { type Request, type Response } from 'express';
import { messagerSugester } from './domain/v1/messager-sugester/routes';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Healthy!');
});

// Rota de Sugestão de Mensagem
app.use('/v1', messagerSugester);

// Middleware Global de Erros (sempre deve vir após as rotas)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
