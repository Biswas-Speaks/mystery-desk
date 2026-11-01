import { LoaderCircle } from 'lucide-react';
export default function LoadingState({ text = 'Opening your case…' }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={28} />
      <h2>{text}</h2>
      <p>Good mysteries take a little thought. Please stay on this page.</p>
    </div>
  );
}
