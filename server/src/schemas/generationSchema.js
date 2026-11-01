import { z } from 'zod';
import { DIFFICULTY_RULES } from '../../../shared/gameRules.js';
const text = z.string().trim().min(1).max(12000),
  id = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
export const generationSchema = z
  .object({
    title: text,
    story: text,
    suspects: z.array(
      z.object({ id, name: text, role: text, description: text, alibi: text }).strict(),
    ),
    clues: z.array(
      z
        .object({
          id,
          title: text,
          type: z.enum(['chat', 'photo_description', 'cctv_log', 'document', 'physical']),
          summary: text,
          content: text,
          relevance: text,
        })
        .strict(),
    ),
    hints: z.array(
      z.object({ id, order: z.number().int(), text, clueIds: z.array(id).min(1) }).strict(),
    ),
    solution: z
      .object({
        culpritSuspectId: id,
        motive: text,
        explanation: text,
        supportingClueIds: z.array(id).min(2),
        timeline: z.array(z.object({ time: text, event: text }).strict()).min(1),
      })
      .strict(),
  })
  .strict();
export function validateGeneration(input, difficulty) {
  const data = generationSchema.parse(input),
    r = DIFFICULTY_RULES[difficulty];
  for (const key of ['suspects', 'clues', 'hints'])
    if (
      data[key].length !== r[key] ||
      new Set(data[key].map((x) => x.id)).size !== data[key].length
    )
      throw Error('Invalid counts or duplicate IDs');
  const clues = new Set(data.clues.map((x) => x.id));
  if (
    !data.suspects.some((x) => x.id === data.solution.culpritSuspectId) ||
    new Set(data.solution.supportingClueIds).size < 2 ||
    !data.solution.supportingClueIds.every((x) => clues.has(x)) ||
    !data.hints.every((h, i) => h.order === i + 1 && h.clueIds.every((x) => clues.has(x)))
  )
    throw Error('Invalid references');
  const publicText = JSON.stringify([
    data.title,
    data.story,
    data.suspects,
    data.clues.map(({ relevance: _r, ...c }) => c),
    data.hints,
  ]);
  if (
    /(?:culprit|perpetrator|guilty party)\s*(?:is|:)|(?:i|we)\s+(?:stole|committed the crime)/i.test(
      publicText,
    ) ||
    /\+?\d[\d ()-]{8,}\d/.test(publicText)
  )
    throw Error('Possible answer leakage or contact number');
  return data;
}
