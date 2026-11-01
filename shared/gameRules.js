/** Public game constants only. Never put credentials or a generated solution in shared/. */
export const DIFFICULTY_RULES = Object.freeze({
  easy: Object.freeze({ suspects: 3, clues: 5, hints: 2, base: 100 }),
  medium: Object.freeze({ suspects: 4, clues: 7, hints: 3, base: 150 }),
  hard: Object.freeze({ suspects: 5, clues: 9, hints: 3, base: 200 }),
});
