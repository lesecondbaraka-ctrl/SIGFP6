import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handlers to avoid a silent blank page and surface runtime errors
function showFatalError(message: string, stack?: string) {
  try {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding:24px;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;">
          <h2 style="color:#b91c1c">Erreur d'exécution (inattendue)</h2>
          <pre style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e5e7eb;color:#111">${message}</pre>
          ${stack ? `<details style="margin-top:8px"><summary>Stack</summary><pre style="white-space:pre-wrap">${stack}</pre></details>` : ''}
        </div>
      `;
    }
  } catch (e) {
    // fallback to console
    console.error('Failed to render fatal error:', e);
  }
}

window.addEventListener('error', (ev) => {
  try {
    const msg = ev.error?.message || ev.message || String(ev);
    const stack = ev.error?.stack || '';
    console.error('Global error caught:', ev.error || ev);
    showFatalError(msg, stack);
  } catch (e) {
    console.error(e);
  }
});

window.addEventListener('unhandledrejection', (ev) => {
  try {
    const reason = ev.reason;
    const msg = reason?.message || String(reason);
    const stack = reason?.stack || '';
    console.error('Unhandled rejection:', reason);
    showFatalError(msg, stack);
  } catch (e) {
    console.error(e);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
