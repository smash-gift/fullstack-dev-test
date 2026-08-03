import app from './app';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  // console.log(`[Server] AI Provider: ${process.env.AI_PROVIDER ?? 'gemini'}`);
});
