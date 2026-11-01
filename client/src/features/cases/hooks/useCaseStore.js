import { useContext } from 'react';
import { CaseContext } from '../state/CaseProvider.jsx';
export default function useCaseStore() {
  const context = useContext(CaseContext);
  if (!context) throw new Error('useCaseStore must be used inside CaseProvider.');
  return context;
}
