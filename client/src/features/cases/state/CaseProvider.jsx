import { createContext, useCallback, useMemo, useReducer, useRef } from 'react';
import { caseApi } from '../services/caseApi.js';
import { ApiError, normalizeError } from '../../../services/httpClient.js';
import { caseReducer, initialCaseState } from './caseReducer.js';

export const CaseContext = createContext(null);

export default function CaseProvider({ children }) {
  const [state, dispatch] = useReducer(caseReducer, initialCaseState);
  const sequence = useRef(0);
  const locks = useRef(new Set());

  const load = useCallback(async (caseId, collection, signal) => {
    const key = `${collection}:${caseId}`,
      requestId = ++sequence.current;
    dispatch({ type: 'REQUEST_STARTED', key, requestId });
    try {
      const data = await (collection === 'cases'
        ? caseApi.get(caseId, signal)
        : caseApi.getResult(caseId, signal));
      dispatch({ type: 'REQUEST_FINISHED', key, requestId, caseId, collection, data });
      return data;
    } catch (error) {
      const normalized = normalizeError(error);
      dispatch({
        type: 'REQUEST_FINISHED',
        key,
        requestId,
        error: normalized.code === 'REQUEST_CANCELLED' ? null : normalized,
        cancelled: normalized.code === 'REQUEST_CANCELLED',
      });
      throw normalized;
    }
  }, []);

  const mutate = useCallback(
    async (key, operation) => {
      if (locks.current.has(key))
        throw new ApiError('An action is already in progress. Please wait.', {
          code: 'ACTION_IN_PROGRESS',
        });
      locks.current.add(key);
      dispatch({ type: 'MUTATION_STARTED', key });
      try {
        const result = await operation();
        dispatch({ type: 'MUTATION_FINISHED', key });
        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        // A response can be lost after the server committed an action. Reconcile
        // through a read; never retry a hint or accusation automatically.
        if (key !== 'create' && ['NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(normalized.code)) {
          try {
            await load(key, 'cases');
          } catch {
            /* The load stores its own safe error. */
          }
        }
        dispatch({ type: 'MUTATION_FINISHED', key, error: normalized });
        throw normalized;
      } finally {
        locks.current.delete(key);
      }
    },
    [load],
  );

  const actions = useMemo(
    () => ({
      clearMutationError: (key) => dispatch({ type: 'MUTATION_ERROR_CLEARED', key }),
      loadCase: (id, signal) => load(id, 'cases', signal),
      loadResult: (id, signal) => load(id, 'results', signal),
      createCase: (input) =>
        mutate('create', async () => {
          const data = await caseApi.create(input);
          dispatch({ type: 'CASE_RECEIVED', data });
          return data;
        }),
      discoverClue: (caseId, clueId) =>
        mutate(caseId, async () => {
          const data = await caseApi.discoverClue(caseId, clueId);
          dispatch({ type: 'CLUE_DISCOVERED', caseId, data });
        }),
      revealHint: (caseId) =>
        mutate(caseId, async () => {
          const data = await caseApi.revealHint(caseId);
          dispatch({ type: 'HINT_REVEALED', caseId, data });
        }),
      accuse: (caseId, suspectId) =>
        mutate(caseId, async () => {
          const result = await caseApi.accuse(caseId, suspectId);
          dispatch({ type: 'CASE_COMPLETED', caseId, result });
          return result;
        }),
    }),
    [load, mutate],
  );
  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}
