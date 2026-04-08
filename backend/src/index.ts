import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import suggestionsRouter from './suggestions';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/suggestions', suggestionsRouter);

app.get('/', (req, res) => {
  res.send('Gift Card Message Suggestion API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
