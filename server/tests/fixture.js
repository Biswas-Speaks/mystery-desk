import { DIFFICULTY_RULES } from '../../shared/gameRules.js';
export function fixture(difficulty = 'medium') {
  const r = DIFFICULTY_RULES[difficulty];
  return {
    title: 'The vanished atlas',
    story:
      'The archive was locked at dusk. A valuable atlas was missing by morning. A service door had been used while the main entrance remained sealed.',
    suspects: Array.from({ length: r.suspects }, (_, i) => ({
      id: `s${i + 1}`,
      name: ['Avery', 'Rowan', 'Ellis', 'Sage', 'Quinn'][i],
      role: 'Archivist',
      description: 'An invented keeper of the archive.',
      alibi: 'Stayed in the reading room until dusk.',
    })),
    clues: Array.from({ length: r.clues }, (_, i) => ({
      id: `c${i + 1}`,
      title: `Archive record ${i + 1}`,
      type: 'document',
      summary: 'An entry in the service ledger.',
      content:
        'FICTIONAL / AI-GENERATED\nOnly Avery signed out the service key. The service door opened at dusk. Fresh ink matches the ledger signature.',
      relevance:
        'The exclusive key access and matching signature connect Avery to the service door.',
    })),
    hints: Array.from({ length: r.hints }, (_, i) => ({
      id: `h${i + 1}`,
      order: i + 1,
      text: 'Compare the service ledger with the door entry.',
      clueIds: ['c1'],
    })),
    solution: {
      culpritSuspectId: 's1',
      motive: 'Wanted to conceal a forged acquisition.',
      explanation:
        'Avery used the service key to remove the atlas through the service door at dusk.',
      supportingClueIds: ['c1', 'c2'],
      timeline: [{ time: 'Dusk', event: 'The service door was opened with the signed-out key.' }],
    },
  };
}
