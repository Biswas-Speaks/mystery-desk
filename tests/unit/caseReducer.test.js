import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  caseReducer,
  initialCaseState,
} from '../../client/src/features/cases/state/caseReducer.js';

const caseData = {
  id: 'case-a',
  status: 'active',
  clues: [{ id: 'c1', discovered: false }],
  revealedHints: [],
  progress: { discoveredClueIds: [], usedHintCount: 0, hintLimit: 3 },
};
const seeded = () => caseReducer(initialCaseState, { type: 'CASE_RECEIVED', data: caseData });

test('stale and cancelled requests never replace newer case state', () => {
  let state = seeded();
  const key = 'cases:case-a';
  state = caseReducer(state, { type: 'REQUEST_STARTED', key, requestId: 1 });
  state = caseReducer(state, { type: 'REQUEST_STARTED', key, requestId: 2 });
  const stale = caseReducer(state, {
    type: 'REQUEST_FINISHED',
    key,
    requestId: 1,
    collection: 'cases',
    caseId: 'case-a',
    data: { id: 'wrong' },
  });
  assert.equal(stale, state);
  state = caseReducer(state, { type: 'REQUEST_FINISHED', key, requestId: 2, cancelled: true });
  assert.equal(state.requests[key].status, 'idle');
  assert.equal(state.requests[key].error, null);
  assert.equal(state.cases['case-a'], caseData);
});

test('starting a mutation invalidates an older in-flight read', () => {
  let state = seeded();
  const key = 'cases:case-a';
  state = caseReducer(state, { type: 'REQUEST_STARTED', key, requestId: 1 });
  state = caseReducer(state, { type: 'MUTATION_STARTED', key: 'case-a' });
  assert.equal(
    caseReducer(state, {
      type: 'REQUEST_FINISHED',
      key,
      requestId: 1,
      collection: 'cases',
      caseId: 'case-a',
      data: {},
    }),
    state,
  );
});

test('discoveries update immutably and hints are deduplicated by ID', () => {
  let state = seeded();
  state = caseReducer(state, {
    type: 'CLUE_DISCOVERED',
    caseId: 'case-a',
    data: { clueId: 'c1', progress: { ...caseData.progress, discoveredClueIds: ['c1'] } },
  });
  assert.equal(state.cases['case-a'].clues[0].discovered, true);
  assert.equal(caseData.clues[0].discovered, false);
  const data = { hint: { id: 'h1', order: 1, text: 'Look closer.' }, usedHintCount: 1 };
  state = caseReducer(state, { type: 'HINT_REVEALED', caseId: 'case-a', data });
  state = caseReducer(state, { type: 'HINT_REVEALED', caseId: 'case-a', data });
  assert.equal(state.cases['case-a'].revealedHints.length, 1);
  assert.equal(state.cases['case-a'].progress.usedHintCount, 1);
});

test('completion discards stale investigation data and isolates other cases', () => {
  let state = seeded();
  state = caseReducer(state, { type: 'CASE_RECEIVED', data: { ...caseData, id: 'case-b' } });
  const result = { correct: true, score: 150 };
  state = caseReducer(state, { type: 'CASE_COMPLETED', caseId: 'case-a', result });
  assert.equal(state.cases['case-a'].status, 'completed');
  assert.equal(state.cases['case-a'].clues, undefined);
  assert.equal(state.results['case-a'], result);
  assert.equal(state.cases['case-b'].status, 'active');
});
