import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './trunk/AppErrorBoundary';
import { TrunkAppV13 } from './trunk/TrunkAppV13';
import './styles.css';
import './trunk/v3.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[omni] PWA service worker unavailable', error);
    });
  }, { once: true });
}

// Une promesse rejetée non gérée n'arrête pas l'app, mais elle reste un défaut :
// on la journalise (corrélation Sentry/logs) au lieu de la laisser silencieuse.
// Le rendu, lui, est couvert par AppErrorBoundary.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[omni] unhandled promise rejection', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <TrunkAppV13 />
    </AppErrorBoundary>
  </StrictMode>,
);
