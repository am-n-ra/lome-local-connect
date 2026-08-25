import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TrunkApp } from './trunk/TrunkApp';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  }, { once: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrunkApp />
  </StrictMode>,
);
