export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});
