import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Case } from '../src/models/Case.js';
import { fixture } from './fixture.js';
import { validateGeneration } from '../src/schemas/generationSchema.js';
import { DIFFICULTY_RULES } from '../../shared/gameRules.js';
import { creationSchema } from '../src/schemas/requestSchemas.js';
import { scoreCase } from '../src/services/scoringService.js';
let mongo, app;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Case.init();
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  await Case.deleteMany({});
  app = createApp({ generate: async ({ difficulty }) => fixture(difficulty) });
});
const input = { premise: 'An antique atlas vanished from a locked archive.', difficulty: 'medium' };
async function create() {
  const response = await request(app).post('/api/cases').send(input);
  expect(response.status).toBe(201);
  return {
    id: response.body.case.id,
    token: response.body.caseAccessToken,
    data: response.body.case,
  };
}
const auth = (r, token) => r.set('Authorization', `Bearer ${token}`);
function safe(body) {
  const json = JSON.stringify(body);
  for (const key of [
    'solution',
    'culpritSuspectId',
    'motive',
    'explanation',
    'relevance',
    'accessTokenHash',
  ])
    expect(json).not.toContain(`"${key}"`);
  expect(json).not.toContain('Compare the service ledger');
}
describe('contracts and scoring', () => {
  it('validates input and all difficulty counts', () => {
    for (const difficulty of Object.keys(DIFFICULTY_RULES))
      expect(validateGeneration(fixture(difficulty), difficulty)).toBeTruthy();
    for (const premise of ['', 'short', 'a'.repeat(1001)])
      expect(creationSchema.safeParse({ ...input, premise }).success).toBe(false);
    expect(creationSchema.safeParse({ ...input, extra: true }).success).toBe(false);
    expect(creationSchema.safeParse({ ...input, difficulty: 'extreme' }).success).toBe(false);
  });
  it('rejects inconsistent references, duplicates and explicit leakage', () => {
    for (const change of [
      (c) => (c.solution.culpritSuspectId = 'missing'),
      (c) => (c.solution.supportingClueIds = ['c1', 'missing']),
      (c) => c.clues.pop(),
      (c) => (c.suspects[1].id = 's1'),
      (c) => (c.story = 'The culprit is Avery.'),
    ]) {
      const c = fixture();
      change(c);
      expect(() => validateGeneration(c, 'medium')).toThrow();
    }
  });
  it('uses the exact scoring formula and floors at zero', () => {
    for (const difficulty of Object.keys(DIFFICULTY_RULES)) {
      const c = { difficulty, progress: { discoveredClueIds: ['a', 'b'], usedHintIds: ['h'] } };
      expect(scoreCase(c, true).total).toBe(DIFFICULTY_RULES[difficulty].base);
      expect(scoreCase(c, false).total).toBe(0);
      c.progress.usedHintIds = [];
      expect(scoreCase(c, false).total).toBe(10);
    }
  });
});
describe('protected gameplay', () => {
  it('health and safe errors', async () => {
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
    expect(
      (
        await request(app)
          .post('/api/cases')
          .send({ ...input, extra: true })
      ).status,
    ).toBe(400);
    expect((await request(app).get('/api/cases/invalid')).status).toBe(400);
  });
  it('requires the correct case token and hides secrets', async () => {
    const a = await create(),
      b = await create();
    safe(a.data);
    expect((await request(app).get(`/api/cases/${a.id}`)).status).toBe(401);
    expect((await auth(request(app).get(`/api/cases/${a.id}`), b.token)).status).toBe(403);
    const response = await auth(request(app).get(`/api/cases/${a.id}`), a.token);
    expect(response.status).toBe(200);
    safe(response.body);
    expect((await auth(request(app).get(`/api/cases/${a.id}/result`), a.token)).status).toBe(409);
  });
  it('discovers clues once and reveals hints sequentially under concurrency', async () => {
    const { id, token } = await create();
    const url = `/api/cases/${id}`;
    const responses = await Promise.all(
      [1, 2].map(() => auth(request(app).post(`${url}/clues/c1/discover`), token).send({})),
    );
    responses.forEach((r) => {
      expect(r.status).toBe(200);
      safe(r.body);
      expect(r.body.progress.discoveredClueIds).toEqual(['c1']);
    });
    expect(responses.map((r) => r.body.alreadyDiscovered).sort()).toEqual([false, true]);
    expect(
      (await auth(request(app).post(`${url}/clues/absent/discover`), token).send({})).status,
    ).toBe(404);
    const hints = await Promise.all(
      [1, 2, 3, 4].map(() => auth(request(app).post(`${url}/hints`), token).send({})),
    );
    expect(
      hints
        .filter((r) => r.status === 200)
        .map((r) => r.body.hint.order)
        .sort(),
    ).toEqual([1, 2, 3]);
    expect(hints.filter((r) => r.status === 409)).toHaveLength(1);
    const c = await Case.findById(id);
    expect(c.progress.usedHintIds).toHaveLength(3);
  });
  it('persists exactly one final accusation and blocks later actions', async () => {
    const { id, token } = await create();
    const url = `/api/cases/${id}`;
    expect(
      (await auth(request(app).post(`${url}/accuse`), token).send({ suspectId: 'missing' })).status,
    ).toBe(400);
    await auth(request(app).post(`${url}/clues/c1/discover`), token).send({});
    const results = await Promise.all(
      ['s1', 's2'].map((suspectId) =>
        auth(request(app).post(`${url}/accuse`), token).send({ suspectId }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const result = (await auth(request(app).get(`${url}/result`), token)).body.result;
    expect(result.score).toBe(result.correct ? 155 : 5);
    expect((await auth(request(app).post(`${url}/hints`), token).send({})).status).toBe(409);
    expect((await auth(request(app).post(`${url}/clues/c2/discover`), token).send({})).status).toBe(
      409,
    );
    const metadata = (await auth(request(app).get(url), token)).body.case;
    expect(metadata.status).toBe('completed');
    expect(metadata.story).toBeUndefined();
    expect(metadata.clues).toBeUndefined();
  });
  it('rejects expired cases before TTL cleanup', async () => {
    const { id, token } = await create();
    await Case.updateOne({ _id: id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await auth(request(app).get(`/api/cases/${id}`), token)).status).toBe(404);
  });
  it('does not persist failed generation', async () => {
    app = createApp({
      generate: async () => {
        throw Error('secret provider detail');
      },
    });
    const response = await request(app).post('/api/cases').send(input);
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('secret');
    expect(await Case.countDocuments()).toBe(0);
  });
});
