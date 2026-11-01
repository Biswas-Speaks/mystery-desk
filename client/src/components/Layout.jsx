import { Link, useLocation } from 'react-router-dom';
import { Fingerprint, ArrowUpRight, ShieldCheck } from 'lucide-react';
export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Fingerprint size={26} />
          </span>
          <span>
            mystery<span className="brand-light">room</span>
            <small>THE TRUTH IS IN THE DETAILS</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/#how-to-play">
            How to play <ArrowUpRight size={15} />
          </Link>
          <span className="nav-separator" />
          <span className="nav-note">A little curiosity goes a long way.</span>
        </nav>
      </header>
      <main key={pathname}>{children}</main>
      <footer>
        <span className="footer-brand">
          <Fingerprint size={17} /> AI Mystery Room
        </span>
        <span>
          <ShieldCheck size={15} /> All cases and evidence are fictional / AI-generated.
        </span>
        <span>Anonymous cases expire after 7 days.</span>
      </footer>
    </>
  );
}
