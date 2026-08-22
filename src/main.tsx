import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TrunkApp } from './trunk/TrunkApp';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrunkApp />
  </StrictMode>,
);
