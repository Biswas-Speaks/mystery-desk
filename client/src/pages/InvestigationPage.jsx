import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, X, Check, FolderOpen, Users } from 'lucide-react';
import useCase from '../features/cases/hooks/useCase.js';
import useCaseMutation from '../features/cases/hooks/useCaseMutation.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ClueCard, { evidenceTypes } from '../components/ClueCard.jsx';
import SuspectCard from '../components/SuspectCard.jsx';
import HintPanel from '../components/HintPanel.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
export default function InvestigationPage() {
  const { id } = useParams(),
    { data: caseData, error, refresh } = useCase(id),
    navigate = useNavigate(),
    [opened, setOpened] = useState(null);
  const { actions, busy, error: mutationError } = useCaseMutation(id);
  const actionError = mutationError;
  const dialog = useRef(null);
  useEffect(() => {
    if (caseData?.status === 'completed') navigate(`/cases/${id}/result`, { replace: true });
  }, [caseData, id, navigate]);
  useEffect(() => {
    if (opened && !dialog.current?.open) dialog.current?.showModal();
    else if (!opened) dialog.current?.close();
  }, [opened, caseData]);
  async function discoverClue(clueId) {
    try {
      await actions.discoverClue(id, clueId);
      setOpened(null);
    } catch (error) {
      if (error.code === 'CASE_COMPLETED') navigate(`/cases/${id}/result`);
    }
  }
  async function revealHint() {
    try {
      await actions.revealHint(id);
    } catch (error) {
      if (error.code === 'CASE_COMPLETED') navigate(`/cases/${id}/result`);
    }
  }
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!caseData || caseData.status === 'completed') return <LoadingState />;
  const selected = opened && caseData.clues.find((clue) => clue.id === opened.id);
  return (
    <section className="page investigation">
      <div className="case-heading">
        <div>
          <span className="eyebrow teal">CASE FILE / ACTIVE INVESTIGATION</span>
          <h1>{caseData.title}</h1>
        </div>
        <span className="badge">{caseData.difficulty} difficulty</span>
      </div>
      <section className="story-panel">
        <span className="eyebrow">THE SITUATION</span>
        <p>{caseData.story}</p>
      </section>
      <ProgressBar
        found={caseData.progress.discoveredClueIds.length}
        total={caseData.clues.length}
      />
      <div className="workspace">
        <section className="evidence-section">
          <div className="section-title">
            <h2>
              <FolderOpen size={22} /> The evidence
            </h2>
            <span>Look closer. Nothing collects itself.</span>
          </div>
          <div className="evidence-grid">
            {caseData.clues.map((clue, index) => (
              <ClueCard key={clue.id} clue={clue} index={index} onOpen={setOpened} />
            ))}
          </div>
        </section>
        <aside className="suspects-section">
          <div className="section-title">
            <h2>
              <Users size={22} /> Persons of interest
            </h2>
            <span>{caseData.suspects.length} suspects</span>
          </div>
          {caseData.suspects.map((suspect, index) => (
            <SuspectCard key={suspect.id} suspect={suspect} index={index} />
          ))}
          <div className="hints-mobile">
            <HintPanel
              hints={caseData.revealedHints}
              used={caseData.progress.usedHintCount}
              limit={caseData.progress.hintLimit}
              busy={busy}
              onRequest={revealHint}
            />
          </div>
        </aside>
      </div>
      {actionError && !opened && (
        <p className="inline-error" role="alert">
          {actionError}
        </p>
      )}
      <section className="accuse-banner">
        <div>
          <h2>Have a theory?</h2>
          <p>You get one final accusation. Make every detail count.</p>
        </div>
        <Link className="button" to={`/cases/${id}/accuse`}>
          Make an accusation <ArrowRight size={18} />
        </Link>
      </section>
      <dialog
        ref={dialog}
        className="evidence-dialog"
        onCancel={() => setOpened(null)}
        onClose={() => setOpened(null)}
      >
        {selected && (
          <>
            <div className="row">
              <span className="eyebrow teal">{evidenceTypes[selected.type].label}</span>
              <button
                className="icon-button"
                aria-label="Close evidence"
                onClick={() => setOpened(null)}
              >
                <X />
              </button>
            </div>
            <h2>{selected.title}</h2>
            <span className="fiction-label">FICTIONAL / AI-GENERATED</span>
            <div className="evidence-content">{selected.content}</div>
            {actionError && (
              <p role="alert" className="inline-error">
                {actionError}
              </p>
            )}
            <div className="row">
              <span className="muted">Discovery adds 5 points.</span>
              <button
                disabled={busy || selected.discovered}
                className="button"
                onClick={() => discoverClue(selected.id)}
              >
                {selected.discovered ? (
                  <>
                    <Check size={17} /> Collected
                  </>
                ) : busy ? (
                  'Collecting…'
                ) : (
                  'Discover clue'
                )}
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
