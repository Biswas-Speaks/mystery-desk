export default function SuspectCard({ suspect, index }) {
  return (
    <article className="suspect-card">
      <div className="row start">
        <span className="avatar">
          {suspect.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </span>
        <div>
          <span className="eyebrow">SUSPECT 0{index + 1}</span>
          <h3>{suspect.name}</h3>
          <span className="muted">{suspect.role}</span>
        </div>
      </div>
      <p>{suspect.description}</p>
      <div className="alibi">
        <strong>Stated alibi</strong>
        <p>“{suspect.alibi}”</p>
      </div>
    </article>
  );
}
