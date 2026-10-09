import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { installErrorListeners, loadErrorRing } from './ui/errorRing';

const root = document.getElementById('root');
if (!root) throw new Error('Missing app root');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);

installErrorListeners();
void loadErrorRing();

// Only the Playwright build (VITE_E2E=1) compiles in the test hook; production bundles drop it.
if (import.meta.env.VITE_E2E === '1' && new URLSearchParams(location.search).has('e2e')) {
  void import('./data/backup/e2e-hook');
}

// Registration is now handled by UpdateBar.tsx so it can show the UI.
