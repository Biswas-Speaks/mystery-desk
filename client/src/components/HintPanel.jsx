import { Lightbulb } from 'lucide-react';
export default function HintPanel({ hints, used, limit, busy, onRequest }) {
  return (
    <section className="hint-panel">
      <div className="row">
        <h3>
          <Lightbulb size={19} /> A fresh perspective
        </h3>
        <span>
          {used}/{limit}
        </span>
      </div>
      <p>Stuck on a detail? A hint can point you in the right direction.</p>
      {hints.map((h) => (
        <div className="revealed-hint" key={h.id}>
          <strong>Hint {h.order}</strong>
          <p>{h.text}</p>
        </div>
      ))}
      <button
        className="button secondary full"
        disabled={busy || used >= limit}
        onClick={onRequest}
      >
        {used >= limit ? 'All hints revealed' : busy ? 'Revealing…' : 'Reveal next hint'}
      </button>
      <small>Each hint deducts 10 points.</small>
    </section>
  );
}
