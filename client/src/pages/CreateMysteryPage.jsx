import { useState } from 'react';
import { DIFFICULTY_RULES } from '../../../shared/gameRules.js';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Check, Info } from 'lucide-react';
import useCaseMutation from '../features/cases/hooks/useCaseMutation.js';
import LoadingState from '../components/LoadingState.jsx';
const levels = [
  { id: 'easy', title: 'Easy', description: 'Find your detective footing.' },
  { id: 'medium', title: 'Medium', description: 'A few more tangled threads.' },
  { id: 'hard', title: 'Hard', description: 'For the detail-obsessed.' },
].map((level) => ({ ...level, ...DIFFICULTY_RULES[level.id] }));
export default function CreateMysteryPage() {
  const [premise, setPremise] = useState(''),
    [difficulty, setDifficulty] = useState('medium'),
    [validationError, setValidationError] = useState('');
  const { actions, busy, error: mutationError } = useCaseMutation('create');
  const error = validationError || mutationError;
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setValidationError('');
    if (premise.trim().length < 20 || premise.trim().length > 1000) {
      setValidationError('Write a premise between 20 and 1,000 characters.');
      return;
    }
    try {
      const caseData = await actions.createCase({ premise: premise.trim(), difficulty });
      navigate(`/cases/${caseData.id}`);
    } catch {
      /* The shared store exposes the request error. */
    }
  }
  return (
    <section className="page form-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} /> Back to the desk
      </Link>
      <div className="page-heading">
        <span className="eyebrow teal">A NEW INVESTIGATION</span>
        <h1>Every mystery starts with an idea.</h1>
        <p>Set the scene. We’ll take care of the secrets.</p>
      </div>
      {busy ? (
        <LoadingState text="Building your mystery…" />
      ) : (
        <form onSubmit={submit} className="create-form">
          <div className="row">
            <label htmlFor="premise">What happened?</label>
            <span className="muted">01 / THE PREMISE</span>
          </div>
          <p className="field-help" id="premise-help">
            A place, a strange event, a missing something. Give your case a starting point.
          </p>
          <textarea
            id="premise"
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="A rare painting disappears during a private dinner at a seaside manor. The doors were locked, and every guest has something to hide…"
            aria-describedby="premise-help premise-count"
          />
          <div className="row field-meta">
            <span>Fictional scenarios only. Leave out personal information.</span>
            <span id="premise-count">{premise.length} / 1,000</span>
          </div>
          <div className="row difficulty-label">
            <label id="difficulty-label">How deep does the mystery go?</label>
            <span className="muted">02 / THE CHALLENGE</span>
          </div>
          <div className="difficulty-grid" role="radiogroup" aria-labelledby="difficulty-label">
            {levels.map((l) => (
              <label
                className={`difficulty-card ${difficulty === l.id ? 'selected' : ''}`}
                key={l.id}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={l.id}
                  checked={difficulty === l.id}
                  onChange={() => setDifficulty(l.id)}
                />
                <div className="row">
                  <strong>{l.title}</strong>
                  <span className="radio-mark">{difficulty === l.id && <Check size={13} />}</span>
                </div>
                <p>{l.description}</p>
                <span>
                  {l.suspects} suspects · {l.clues} clues · {l.hints} hints
                </span>
              </label>
            ))}
          </div>
          {error && (
            <div role="alert" className="inline-error">
              {error}
            </div>
          )}
          <div className="form-bottom">
            <span>
              <Sparkles size={17} /> Original case. Generated just for you.
            </span>
            <button className="button" type="submit">
              Generate case <ArrowRight size={17} />
            </button>
          </div>
        </form>
      )}
      <div className="privacy-note">
        <Info size={17} />
        <p>
          Your case is private to this browser tab and expires after 7 days. All stories and
          evidence are fictional / AI-generated.
        </p>
      </div>
    </section>
  );
}
