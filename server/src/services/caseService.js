import { findCase, insertCase, updateActiveCase } from '../repositories/caseRepository.js';
import { createAccessToken, hashAccessToken } from '../utils/accessToken.js';
import { fail } from '../utils/AppError.js';
import {
  serializeCase,
  serializeProgress,
  serializeResult,
  serializeHint,
} from '../serializers/caseSerializer.js';
import { scoreCase } from './scoringService.js';

const CASE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CONCURRENT_UPDATE_ATTEMPTS = 20;

async function mutateActiveCase(caseId, operation, options = {}) {
  for (let attempt = 0; attempt < MAX_CONCURRENT_UPDATE_ATTEMPTS; attempt++) {
    const caseDocument = await findCase(caseId, options);
    if (caseDocument.status !== 'active')
      fail(409, 'CASE_COMPLETED', 'This case already has a final verdict.');
    const { update, serialize } = operation(caseDocument);
    if (!update) return serialize(caseDocument);
    const updated = await updateActiveCase(caseId, caseDocument.revision, update, options);
    if (updated) return serialize(updated);
  }
  fail(503, 'SERVICE_UNAVAILABLE', 'Case is busy. Please retry.');
}

/** Gameplay rules live here; HTTP handlers only validate and send responses. */
export function createCaseService(generateCase) {
  return {
    async create(input) {
      const generated = await generateCase(input);
      const caseAccessToken = createAccessToken();
      const caseDocument = await insertCase({
        ...generated,
        ...input,
        accessTokenHash: hashAccessToken(caseAccessToken),
        expiresAt: new Date(Date.now() + CASE_LIFETIME_MS),
      });
      return { caseAccessToken, case: serializeCase(caseDocument) };
    },
    async get(caseId) {
      return { case: serializeCase(await findCase(caseId)) };
    },
    discoverClue(caseId, clueId) {
      return mutateActiveCase(caseId, (caseDocument) => {
        if (!caseDocument.clues.some((clue) => clue.id === clueId))
          fail(404, 'CASE_NOT_FOUND', 'Clue not found.');
        const alreadyDiscovered = caseDocument.progress.discoveredClueIds.includes(clueId);
        return {
          update: alreadyDiscovered
            ? null
            : { $addToSet: { 'progress.discoveredClueIds': clueId } },
          serialize: (updated) => ({
            clueId,
            discovered: true,
            alreadyDiscovered,
            progress: serializeProgress(updated),
          }),
        };
      });
    },
    revealHint(caseId) {
      return mutateActiveCase(caseId, (caseDocument) => {
        const hint = caseDocument.hints[caseDocument.progress.usedHintIds.length];
        if (!hint) fail(409, 'HINTS_EXHAUSTED', 'All hints have been revealed.');
        return {
          update: { $push: { 'progress.usedHintIds': hint.id } },
          serialize: (updated) => ({
            hint: serializeHint(hint),
            usedHintCount: updated.progress.usedHintIds.length,
            remainingHints: updated.hints.length - updated.progress.usedHintIds.length,
          }),
        };
      });
    },
    accuse(caseId, suspectId) {
      return mutateActiveCase(
        caseId,
        (caseDocument) => {
          if (!caseDocument.suspects.some((suspect) => suspect.id === suspectId))
            fail(400, 'VALIDATION_ERROR', 'Choose a suspect from this case.');
          const correct = suspectId === caseDocument.solution.culpritSuspectId;
          return {
            update: {
              $set: {
                status: 'completed',
                accusation: { suspectId, correct, submittedAt: new Date() },
                score: scoreCase(caseDocument, correct).total,
              },
            },
            serialize: (updated) => ({ status: 'completed', result: serializeResult(updated) }),
          };
        },
        { includeSolution: true },
      );
    },
    async getResult(caseId) {
      const caseDocument = await findCase(caseId, { includeSolution: true });
      if (caseDocument.status !== 'completed')
        fail(409, 'CASE_NOT_COMPLETED', 'Finish your investigation with an accusation first.');
      return { result: serializeResult(caseDocument) };
    },
  };
}
