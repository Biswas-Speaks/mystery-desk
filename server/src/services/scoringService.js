import { DIFFICULTY_RULES } from '../../../shared/gameRules.js';
export function scoreCase(c, correct) {
  const base = correct ? DIFFICULTY_RULES[c.difficulty].base : 0,
    clueBonus = c.progress.discoveredClueIds.length * 5,
    hintPenalty = c.progress.usedHintIds.length * 10;
  return { base, clueBonus, hintPenalty, total: Math.max(0, base + clueBonus - hintPenalty) };
}
