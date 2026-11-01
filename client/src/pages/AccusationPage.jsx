import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TriangleAlert, ArrowRight } from 'lucide-react';
import useCase from '../features/cases/hooks/useCase.js';
import useCaseMutation from '../features/cases/hooks/useCaseMutation.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
export default function AccusationPage() {
  const { id } = useParams(),
    { data: caseData, error, refresh } = useCase(id),
    navigate = useNavigate(),
    [selected, setSelected] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [validationError, setValidationError] = useState('');
  const { actions, busy, error: mutationError } = useCaseMutation(id);
  const submitError = validationError || mutationError;
  useEffect(() => {
    if (caseData?.status === 'completed') navigate(`/cases/${id}/result`, { replace: true });
  }, [caseData, id, navigate]);
  async function submit(event) {
    event.preventDefault();
    setValidationError('');
    if (!selected || !confirmed) {
      setValidationError('Choose a suspect and acknowledge your final decision.');
      return;
    }
    try {
      await actions.accuse(id, selected);
      navigate(`/cases/${id}/result`);
    } catch (error) {
      if (error.code === 'CASE_COMPLETED') navigate(`/cases/${id}/result`);
    }
  }
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!caseData || caseData.status === 'completed') return <LoadingState />;
  return (
    <section className="page form-page">
      <Link className="back-link" to={`/cases/${id}`}>
        <ArrowLeft size={16} /> Back to investigation
      </Link>
      <div className="page-heading">
        <span className="eyebrow teal">THE FINAL DEDUCTION</span>
        <h1>Who’suspect behind it?</h1>
        <p>You’ve seen the evidence. Now follow your reasoning.</p>
      </div>
      <div className="warning">
        <TriangleAlert />
        <div>
          <strong>One accusation. No second chances.</strong>
          <p>Your choice is final. Once confirmed, the case closes and the solution is revealed.</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <fieldset className="accusation-options">
          <legend>Choose your suspect</legend>
          {caseData.suspects.map((suspect) => (
            <label
              key={suspect.id}
              className={`suspect-option ${selected === suspect.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="suspect"
                value={suspect.id}
                checked={selected === suspect.id}
                onChange={() => setSelected(suspect.id)}
                disabled={busy}
              />
              <div>
                <strong>{suspect.name}</strong>
                <span>{suspect.role}</span>
                <p>{suspect.description}</p>
              </div>
            </label>
          ))}
        </fieldset>
        <label className="confirmation">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            disabled={busy}
          />{' '}
          I understand this accusation is final and cannot be changed.
        </label>
        {submitError && (
          <p className="inline-error" role="alert">
            {submitError}
          </p>
        )}
        <div className="form-bottom">
          <Link className="back-link" to={`/cases/${id}`}>
            Review the evidence
          </Link>
          <button className="button" disabled={busy} type="submit">
            {busy ? 'Submitting…' : 'Confirm accusation'} <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}
