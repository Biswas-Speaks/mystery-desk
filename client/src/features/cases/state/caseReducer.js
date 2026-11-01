export const initialCaseState = { cases: {}, results: {}, requests: {}, mutations: {} };
export const idleRequest = Object.freeze({ status: 'idle', error: null });

/** Request IDs prevent stale/aborted responses from replacing a newer request. */
export function caseReducer(state, action) {
  switch (action.type) {
    case 'MUTATION_ERROR_CLEARED':
      if (state.mutations[action.key]?.status === 'loading') return state;
      return { ...state, mutations: { ...state.mutations, [action.key]: idleRequest } };
    case 'REQUEST_STARTED':
      return {
        ...state,
        requests: {
          ...state.requests,
          [action.key]: { status: 'loading', error: null, requestId: action.requestId },
        },
      };
    case 'REQUEST_FINISHED': {
      if (state.requests[action.key]?.requestId !== action.requestId) return state;
      const requests = {
        ...state.requests,
        [action.key]: {
          status: action.error ? 'error' : action.cancelled ? 'idle' : 'success',
          error: action.error || null,
        },
      };
      if (action.error || action.cancelled) return { ...state, requests };
      return {
        ...state,
        requests,
        [action.collection]: { ...state[action.collection], [action.caseId]: action.data },
      };
    }
    case 'MUTATION_STARTED':
      return {
        ...state,
        requests: {
          ...state.requests,
          [`cases:${action.key}`]: {
            ...state.requests[`cases:${action.key}`],
            requestId: null,
          },
        },
        mutations: { ...state.mutations, [action.key]: { status: 'loading', error: null } },
      };
    case 'MUTATION_FINISHED':
      return {
        ...state,
        mutations: {
          ...state.mutations,
          [action.key]: { status: action.error ? 'error' : 'success', error: action.error || null },
        },
      };
    case 'CASE_RECEIVED':
      return { ...state, cases: { ...state.cases, [action.data.id]: action.data } };
    case 'CLUE_DISCOVERED': {
      const current = state.cases[action.caseId];
      if (!current) return state;
      return {
        ...state,
        cases: {
          ...state.cases,
          [action.caseId]: {
            ...current,
            progress: action.data.progress,
            clues: current.clues.map((clue) =>
              clue.id === action.data.clueId ? { ...clue, discovered: true } : clue,
            ),
          },
        },
      };
    }
    case 'HINT_REVEALED': {
      const current = state.cases[action.caseId];
      if (!current) return state;
      const revealedHints = [
        ...current.revealedHints.filter((hint) => hint.id !== action.data.hint.id),
        action.data.hint,
      ].sort((a, b) => a.order - b.order);
      return {
        ...state,
        cases: {
          ...state.cases,
          [action.caseId]: {
            ...current,
            revealedHints,
            progress: { ...current.progress, usedHintCount: action.data.usedHintCount },
          },
        },
      };
    }
    case 'CASE_COMPLETED': {
      const current = state.cases[action.caseId];
      return {
        ...state,
        cases: {
          ...state.cases,
          [action.caseId]: {
            id: action.caseId,
            title: current?.title,
            difficulty: current?.difficulty,
            status: 'completed',
          },
        },
        results: { ...state.results, [action.caseId]: action.result },
      };
    }
    default:
      return state;
  }
}
