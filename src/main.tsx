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

// The APK must skip service worker registration when Capacitor is added.
if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW());
}
