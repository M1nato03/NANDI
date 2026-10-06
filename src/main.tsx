import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing app root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Only the Playwright build (VITE_E2E=1) compiles in the test hook; production bundles drop it.
if (import.meta.env.VITE_E2E === '1' && new URLSearchParams(location.search).has('e2e')) {
  void import('./data/backup/e2e-hook');
}

// The APK must skip service worker registration when Capacitor is added.
if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW());
}
