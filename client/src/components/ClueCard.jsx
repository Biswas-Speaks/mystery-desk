import { FileText, MessagesSquare, Camera, Clock, Search, Check, ArrowUpRight } from 'lucide-react';
export const evidenceTypes = {
  chat: { label: 'Simulated transcript', Icon: MessagesSquare },
  photo_description: { label: 'Photo description', Icon: Camera },
  cctv_log: { label: 'Fictional CCTV log', Icon: Clock },
  document: { label: 'Document', Icon: FileText },
  physical: { label: 'Physical evidence', Icon: Search },
};
export default function ClueCard({ clue, index, onOpen }) {
  const { label, Icon } = evidenceTypes[clue.type];
  return (
    <button
      className={`clue-card ${clue.discovered ? 'collected' : ''}`}
      onClick={() => onOpen(clue)}
    >
      <div className="row">
        <span className="evidence-icon">
          <Icon size={22} />
        </span>
        <span className="clue-number">EVIDENCE {String(index + 1).padStart(2, '0')}</span>
      </div>
      <span className="eyebrow">{label}</span>
      <h3>{clue.title}</h3>
      <p>{clue.summary}</p>
      <div className="clue-bottom">
        {clue.discovered ? (
          <span className="teal">
            <Check size={15} /> Collected
          </span>
        ) : (
          <span>
            Inspect evidence <ArrowUpRight size={16} />
          </span>
        )}
        <small>FICTIONAL / AI-GENERATED</small>
      </div>
    </button>
  );
}
