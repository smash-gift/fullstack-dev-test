import 'dotenv/config';
import { createApp } from './app';
import { PORT } from './config/env';

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
