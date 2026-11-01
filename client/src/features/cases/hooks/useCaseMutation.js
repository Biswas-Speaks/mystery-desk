import { useEffect } from 'react';
import useCaseStore from './useCaseStore.js';

/** Mutation state belongs to a case (or the create form), not to each page. */
export default function useCaseMutation(key) {
  const { state, actions } = useCaseStore();
  useEffect(() => {
    actions.clearMutationError(key);
  }, [actions, key]);
  const mutation = state.mutations[key];
  return { actions, busy: mutation?.status === 'loading', error: mutation?.error?.message || '' };
}
