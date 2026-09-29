// Fuentes autoalojadas (Vite las sirve desde el bundle; font-display: swap).
import '@fontsource-variable/ibm-plex-sans/wght.css';
import '@fontsource-variable/ibm-plex-sans/wght-italic.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './styles/tokens.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encuentra el elemento #root');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
