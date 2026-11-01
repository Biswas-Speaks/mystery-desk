import { DIFFICULTY_RULES } from '../../../shared/gameRules.js';
import { scoreCase } from '../services/scoringService.js';
export const serializeHint = (hint) => ({
  id: hint.id,
  order: hint.order,
  text: hint.text,
  clueIds: [...hint.clueIds],
});
export const serializeProgress = (caseDocument) => ({
  discoveredClueIds: [...caseDocument.progress.discoveredClueIds],
  usedHintCount: caseDocument.progress.usedHintIds.length,
  hintLimit: DIFFICULTY_RULES[caseDocument.difficulty].hints,
});
export function serializeCase(caseDocument) {
  const meta = {
    id: String(caseDocument._id),
    title: caseDocument.title,
    difficulty: caseDocument.difficulty,
    status: caseDocument.status,
    expiresAt: caseDocument.expiresAt,
  };
  if (caseDocument.status === 'completed') return meta;
  return {
    ...meta,
    story: caseDocument.story,
    suspects: caseDocument.suspects.map((suspect) => ({
      id: suspect.id,
      name: suspect.name,
      role: suspect.role,
      description: suspect.description,
      alibi: suspect.alibi,
    })),
    clues: caseDocument.clues.map((clue) => ({
      id: clue.id,
      title: clue.title,
      type: clue.type,
      summary: clue.summary,
      content: clue.content,
      discovered: caseDocument.progress.discoveredClueIds.includes(clue.id),
    })),
    progress: serializeProgress(caseDocument),
    revealedHints: caseDocument.hints
      .filter((hint) => caseDocument.progress.usedHintIds.includes(hint.id))
      .map(serializeHint),
  };
}
export function serializeResult(caseDocument) {
  const solution = caseDocument.solution;
  return {
    correct: caseDocument.accusation.correct,
    accusedSuspectId: caseDocument.accusation.suspectId,
    accusedSuspectName: caseDocument.suspects.find(
      (suspect) => suspect.id === caseDocument.accusation.suspectId,
    )?.name,
    submittedAt: caseDocument.accusation.submittedAt,
    culpritSuspectId: solution.culpritSuspectId,
    culpritName: caseDocument.suspects.find((item) => item.id === solution.culpritSuspectId).name,
    motive: solution.motive,
    explanation: solution.explanation,
    supportingClueIds: [...solution.supportingClueIds],
    supportingClues: caseDocument.clues
      .filter((item) => solution.supportingClueIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        relevance: item.relevance,
      })),
    timeline: solution.timeline.map((item) => ({ time: item.time, event: item.event })),
    score: caseDocument.score,
    scoreBreakdown: scoreCase(caseDocument, caseDocument.accusation.correct),
  };
}
