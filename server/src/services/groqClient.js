import Groq from 'groq-sdk';
export function createGroqClient(env) {
  return new Groq({
    apiKey: env.GROQ_API_KEY,
    maxRetries: 0,
    timeout: Number(env.AI_TIMEOUT_MS || 45000),
  });
}
