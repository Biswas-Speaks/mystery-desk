export default function ProgressBar({ found, total }) {
  return (
    <div className="progress-block">
      <div className="row">
        <strong>Investigation progress</strong>
        <span>
          {found} of {total} clues collected
        </span>
      </div>
      <progress value={found} max={total} aria-label={`${found} of ${total} clues collected`} />
    </div>
  );
}
