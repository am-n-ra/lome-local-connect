import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TrunkApp } from './trunk/TrunkApp';
import './styles.css';
import './trunk/v3.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[omni] PWA service worker unavailable', error);
    });
  }, { once: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrunkApp />
  </StrictMode>,
);
