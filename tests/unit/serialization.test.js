import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeCase, serializeResult } from '../../server/src/serializers/caseSerializer.js';
import { fixture } from '../../server/tests/fixture.js';

test('active DTOs exclude secrets and unrevealed hints at every difficulty', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const generated = fixture(difficulty);
    const data = {
      ...generated,
      _id: 'case-a',
      difficulty,
      status: 'active',
      accessTokenHash: 'private-hash',
      progress: { discoveredClueIds: ['c1'], usedHintIds: ['h1'] },
    };
    const response = serializeCase(data);
    const json = JSON.stringify(response);
    for (const field of [
      'solution',
      'culpritSuspectId',
      'motive',
      'explanation',
      'relevance',
      'accessTokenHash',
    ])
      assert.equal(json.includes(`"${field}"`), false);
    assert.equal(response.revealedHints.length, 1);
    assert.equal(response.revealedHints[0].id, 'h1');
    assert.equal(json.includes('"h2"'), false);
    assert.equal(response.clues[0].discovered, true);
    assert.equal(response.clues[1].discovered, false);
  }
});

test('completed case reads contain only metadata; results disclose the persisted verdict', () => {
  const data = {
    ...fixture(),
    _id: 'case-a',
    difficulty: 'medium',
    status: 'completed',
    score: 155,
    accusation: { suspectId: 's1', correct: true },
    progress: { discoveredClueIds: ['c1'], usedHintIds: [] },
  };
  const metadata = serializeCase(data);
  assert.equal(metadata.clues, undefined);
  assert.equal(metadata.solution, undefined);
  assert.equal(metadata.story, undefined);
  const result = serializeResult(data);
  assert.equal(result.culpritName, 'Avery');
  assert.equal(result.accusedSuspectName, 'Avery');
  assert.equal(result.score, result.scoreBreakdown.total);
  assert.equal(result.supportingClues.length, 2);
});
