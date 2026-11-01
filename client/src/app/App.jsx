import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import HomePage from '../pages/HomePage.jsx';
import CreateMysteryPage from '../pages/CreateMysteryPage.jsx';
import InvestigationPage from '../pages/InvestigationPage.jsx';
import AccusationPage from '../pages/AccusationPage.jsx';
import ResultsPage from '../pages/ResultsPage.jsx';
export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateMysteryPage />} />
        <Route path="/cases/:id" element={<InvestigationPage />} />
        <Route path="/cases/:id/accuse" element={<AccusationPage />} />
        <Route path="/cases/:id/result" element={<ResultsPage />} />
        <Route
          path="*"
          element={
            <section className="error-state">
              <span className="eyebrow teal">404 / A DEAD END</span>
              <h1>This trail doesn’t lead anywhere.</h1>
              <p>The page you’re looking for isn’t here.</p>
              <Link className="button" to="/">
                Back to the desk
              </Link>
            </section>
          }
        />
      </Routes>
    </Layout>
  );
}
