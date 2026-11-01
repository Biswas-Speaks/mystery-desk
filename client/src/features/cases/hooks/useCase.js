import { useCallback, useEffect } from 'react';
import useCaseStore from './useCaseStore.js';
import { idleRequest } from '../state/caseReducer.js';

/** Refresh on route entry; abort on departure and isolate each case by ID. */
export default function useCase(caseId, { result = false } = {}) {
  const { state, actions } = useCaseStore();
  const collection = result ? 'results' : 'cases';
  const load = result ? actions.loadResult : actions.loadCase;
  const request = state.requests[`${collection}:${caseId}`] || idleRequest;
  const refresh = useCallback(
    async (signal) => {
      try {
        return await load(caseId, signal instanceof AbortSignal ? signal : undefined);
      } catch {
        return null;
      } // The store exposes the safe error to the page.
    },
    [caseId, load],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  return {
    data: request.status === 'success' ? state[collection][caseId] : null,
    error: request.error?.message || '',
    errorCode: request.error?.code,
    refresh,
    status: request.status,
  };
}
