import 'dotenv/config';

import createApp from './app';
import { getEnv, assertProductionEnv } from './config/env';

const env = getEnv();
assertProductionEnv(env);

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`smash-gift backend listening on port ${env.port}`);
});
