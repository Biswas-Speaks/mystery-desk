import { Component } from 'react';

/** Last-resort recovery for rendering errors. Requests have page-level recovery. */
export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError)
      return (
        <main className="error-state" role="alert">
          <h1>Something interrupted the investigation.</h1>
          <p>Reload this tab to restore your case from the server.</p>
          <button className="button" onClick={() => window.location.reload()}>
            Reload this tab
          </button>
          <p>
            <a href="/">Return home</a>
          </p>
        </main>
      );
    return this.props.children;
  }
}
