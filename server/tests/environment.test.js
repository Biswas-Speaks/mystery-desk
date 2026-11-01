import { describe, it, expect } from 'vitest';
import { readEnv } from '../src/config/env.js';
const valid = {
  MONGODB_URI: 'mongodb+srv://user:secret@example.invalid/dev',
  GROQ_API_KEY: 'secret-key',
  GROQ_MODEL: 'configured-model',
  CLIENT_URL: 'http://localhost:5173',
};
describe('environment validation', () => {
  it('validates isolated input without loading .env or exposing credentials', () => {
    expect(readEnv(valid).AI_TIMEOUT_MS).toBe(45000);
    expect(() => readEnv({ ...valid, GROQ_MODEL: '', CLIENT_URL: '*' })).toThrow(
      'GROQ_MODEL, CLIENT_URL',
    );
    try {
      readEnv({ ...valid, MONGODB_URI: 'secret-value' });
    } catch (error) {
      expect(error.message).not.toContain('secret-value');
    }
  });
  it.each(['https://example.test/path', 'ftp://example.test', '*'])(
    'rejects unsafe CORS origin %s',
    (CLIENT_URL) => {
      expect(() => readEnv({ ...valid, CLIENT_URL })).toThrow();
    },
  );
});
