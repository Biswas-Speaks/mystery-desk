import { Link } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
export default function ErrorState({ message, onRetry }) {
  return (
    <section className="error-state" role="alert">
      <CircleAlert />
      <h2>We couldn’t open this case</h2>
      <p>{message}</p>
      <p className="muted">
        Cases stay accessible in their original browser tab for 7 days. A lost access token cannot
        be recovered.
      </p>
      <div className="actions">
        {onRetry && (
          <button className="button secondary" onClick={onRetry}>
            Try again
          </button>
        )}
        <Link className="button" to="/create">
          Start a new case
        </Link>
      </div>
    </section>
  );
}
