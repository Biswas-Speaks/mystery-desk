import dotenv from 'dotenv';
import { z } from 'zod';

const environmentSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().min(1),
  GROQ_RESPONSE_MODE: z.enum(['json_schema', 'json_object']).default('json_schema'),
  CLIENT_URL: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.split(',').every((origin) => {
          try {
            const url = new URL(origin.trim());
            return ['http:', 'https:'].includes(url.protocol) && url.origin === origin.trim();
          } catch {
            return false;
          }
        }),
      'Expected comma-separated HTTP origins',
    ),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1).max(45000).default(45000),
  AI_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(3).default(3),
});

/** Optional input keeps validation testable without loading files or mutating process.env. */
export function readEnv(source) {
  if (!source) {
    const loaded = dotenv.config({
      path: process.env.SERVER_ENV_FILE || new URL('../../../config/server/.env', import.meta.url),
      quiet: true,
    });
    if (loaded.error && loaded.error.code !== 'ENOENT')
      throw new Error('Unable to read the configured server environment file.');
  }
  const parsed = environmentSchema.safeParse(source || process.env);
  if (!parsed.success)
    throw new Error(
      `Missing or invalid environment fields: ${[...new Set(parsed.error.issues.map((issue) => issue.path[0]))].join(', ')}. See config/server/.env.example.`,
    );
  return parsed.data;
}
