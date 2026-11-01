import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, CircleX, ArrowRight } from 'lucide-react';
import useCase from '../features/cases/hooks/useCase.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
export default function ResultsPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { data: result, error, errorCode, refresh } = useCase(id, { result: true });
  useEffect(() => {
    if (errorCode === 'CASE_NOT_COMPLETED') navigate(`/cases/${id}`, { replace: true });
  }, [errorCode, id, navigate]);
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!result) return <LoadingState text="Opening the final verdict…" />;
  return (
    <section className="page results-page">
      <div className={`verdict ${result.correct ? 'success' : 'incorrect'}`}>
        {result.correct ? <CircleCheck size={36} /> : <CircleX size={36} />}
        <span className="eyebrow">CASE CLOSED</span>
        <h1>{result.correct ? 'A sharp deduction.' : 'The truth took another turn.'}</h1>
        <p>
          {result.correct
            ? 'Correct accusation. You connected the right details.'
            : 'Incorrect accusation. Every investigation teaches you something.'}
        </p>
      </div>
      <div className="results-grid">
        <section>
          <div className="panel">
            <span className="eyebrow teal">THE REVEAL</span>
            <h2>{result.culpritName}</h2>
            <p className="muted">Your accusation: {result.accusedSuspectName}</p>
            <h3>The motive</h3>
            <p>{result.motive}</p>
            <h3>How it happened</h3>
            <p>{result.explanation}</p>
          </div>
          <div className="panel">
            <h2>The evidence that mattered</h2>
            {result.supportingClues.map((clue) => (
              <article className="supporting-clue" key={clue.id}>
                <span className="fiction-label">FICTIONAL / AI-GENERATED</span>
                <h3>{clue.title}</h3>
                <p>{clue.content}</p>
                <p className="teal">{clue.relevance}</p>
              </article>
            ))}
          </div>
          <div className="panel">
            <h2>The timeline</h2>
            {result.timeline.map((entry, index) => (
              <div className="timeline-row" key={index}>
                <strong>{entry.time}</strong>
                <p>{entry.event}</p>
              </div>
            ))}
          </div>
        </section>
        <aside>
          <div className="score-card">
            <span className="eyebrow">YOUR CASE SCORE</span>
            <strong className="score">
              {result.score}
              <small>points</small>
            </strong>
            <div className="score-row">
              <span>Accusation base</span>
              <strong>{result.scoreBreakdown.base}</strong>
            </div>
            <div className="score-row">
              <span>Clues collected</span>
              <strong>+{result.scoreBreakdown.clueBonus}</strong>
            </div>
            <div className="score-row">
              <span>Hints used</span>
              <strong>−{result.scoreBreakdown.hintPenalty}</strong>
            </div>
            <div className="score-row total">
              <span>Total (minimum 0)</span>
              <strong>{result.score}</strong>
            </div>
            <p>Curiosity counts. Collected clues earn points even when an accusation misses.</p>
            <Link className="button full" to="/create">
              Play again <ArrowRight size={17} />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
