import { describe, it, expect, vi } from 'vitest';
import { createCaseGenerator } from '../src/services/caseGeneratorService.js';
import { fixture } from './fixture.js';
const env = { GROQ_MODEL: 'test-model', AI_TIMEOUT_MS: 2000, AI_MAX_ATTEMPTS: 3 };
const response = (c) => ({
  choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(c) } }],
});
describe('Groq generation', () => {
  it.each(['easy', 'medium', 'hard'])(
    'accepts validated %s cases in schema mode',
    async (difficulty) => {
      const call = vi.fn().mockResolvedValue(response(fixture(difficulty)));
      const generate = createCaseGenerator({ chat: { completions: { create: call } } }, env);
      expect(
        (await generate({ premise: 'A fictional archive theft.', difficulty })).title,
      ).toBeTruthy();
      expect(call.mock.calls[0][0].response_format.type).toBe('json_schema');
      expect(call.mock.calls[0][1].timeout).toBeLessThanOrEqual(2000);
    },
  );
  it('supports explicitly configured JSON Object mode', async () => {
    const call = vi.fn().mockResolvedValue(response(fixture()));
    await createCaseGenerator(
      { chat: { completions: { create: call } } },
      { ...env, GROQ_RESPONSE_MODE: 'json_object' },
    )({ difficulty: 'medium', premise: 'An archive theft.' });
    expect(call.mock.calls[0][0].response_format).toEqual({ type: 'json_object' });
  });
  it.each([
    { choices: [{ finish_reason: 'stop', message: { content: 'invalid' } }] },
    { choices: [{ finish_reason: 'length', message: { content: '{}' } }] },
    { choices: [{ finish_reason: 'stop', message: { content: '' } }] },
  ])('bounds invalid response retries', async (invalid) => {
    const call = vi.fn().mockResolvedValue(invalid);
    await expect(
      createCaseGenerator(
        { chat: { completions: { create: call } } },
        env,
      )({ difficulty: 'medium', premise: 'An archive theft.' }),
    ).rejects.toMatchObject({ status: 502, code: 'AI_GENERATION_FAILED' });
    expect(call).toHaveBeenCalledTimes(3);
  });
  it.each([429, 500, 503])('hides provider %s failures', async (status) => {
    const call = vi.fn().mockRejectedValue({ status, message: 'sensitive data' });
    await expect(
      createCaseGenerator(
        { chat: { completions: { create: call } } },
        { ...env, AI_TIMEOUT_MS: 10 },
      )({ difficulty: 'medium', premise: 'An archive theft.' }),
    ).rejects.toMatchObject({ status: 503, code: 'SERVICE_UNAVAILABLE' });
    expect(call.mock.calls.length).toBeLessThanOrEqual(3);
  });
  it('stops at the overall deadline', async () => {
    const call = vi.fn(async (_request, options) => {
      await new Promise((_resolve, reject) =>
        options.signal.addEventListener('abort', () => reject(Error('timeout')), { once: true }),
      );
    });
    await expect(
      createCaseGenerator(
        { chat: { completions: { create: call } } },
        { ...env, AI_TIMEOUT_MS: 20 },
      )({ difficulty: 'medium', premise: 'An archive theft.' }),
    ).rejects.toMatchObject({ status: 502 });
    expect(call).toHaveBeenCalledTimes(1);
  });
});
