import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAccessToken,
  hashAccessToken,
  verifyAccessToken,
} from '../../server/src/utils/accessToken.js';
import { scoreCase } from '../../server/src/services/scoringService.js';
import { DIFFICULTY_RULES } from '../../shared/gameRules.js';
import {
  assertSessionStorageAvailable,
  readCaseToken,
  saveCaseToken,
  SessionStorageError,
} from '../../client/src/services/sessionStorage.js';

test('case tokens reject mismatches and malformed persisted hashes without crashing', () => {
  const token = createAccessToken(),
    hash = hashAccessToken(token);
  assert.equal(token.length, 64);
  assert.notEqual(token, createAccessToken());
  assert.equal(verifyAccessToken(token, hash), true);
  for (const invalid of ['', undefined, 'invalid', 'a'.repeat(63)]) {
    assert.equal(verifyAccessToken(token, invalid), false);
    assert.equal(verifyAccessToken(invalid, hash), false);
  }
  assert.equal(verifyAccessToken(createAccessToken(), hash), false);
});

test('scores use shared difficulty limits, correct bonuses and a zero floor', () => {
  for (const [difficulty, rules] of Object.entries(DIFFICULTY_RULES)) {
    const data = {
      difficulty,
      progress: { discoveredClueIds: Array(rules.clues).fill('clue'), usedHintIds: [] },
    };
    assert.equal(scoreCase(data, true).total, rules.base + rules.clues * 5);
    assert.equal(scoreCase(data, false).total, rules.clues * 5);
    data.progress = { discoveredClueIds: [], usedHintIds: ['h1', 'h2'] };
    assert.equal(scoreCase(data, false).total, 0);
  }
});

test('session storage failures become explicit recovery errors', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  try {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('storage blocked');
      },
    });
    assert.throws(() => assertSessionStorageAvailable(), SessionStorageError);
    assert.throws(() => readCaseToken('case-a'), SessionStorageError);
    assert.throws(() => saveCaseToken('case-a', 'token'), SessionStorageError);
    const values = new Map();
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        setItem: (key, value) => values.set(key, value),
        getItem: (key) => values.get(key) || null,
        removeItem: (key) => values.delete(key),
      },
    });
    assertSessionStorageAvailable();
    assert.equal(values.size, 0);
    saveCaseToken('case-a', 'token');
    assert.equal(readCaseToken('case-a'), 'token');
    assert.equal(readCaseToken('case-b'), null);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor);
    else delete globalThis.sessionStorage;
  }
});
