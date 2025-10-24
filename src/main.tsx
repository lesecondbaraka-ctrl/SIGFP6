import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/responsive.css';

// Global error handlers: render into a dedicated overlay instead of mutating #root
function getOrCreateErrorOverlay() {
  let overlay = document.getElementById('fatal-error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fatal-error-overlay';
    overlay.setAttribute('role', 'alert');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2147483647';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.overflow = 'auto';
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showFatalError(message: string, stack?: string) {
  try {
    const overlay = getOrCreateErrorOverlay();
    overlay.innerHTML = `
      <div style="min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px;">
        <div style="max-width:860px;width:100%;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(0,0,0,0.2);font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;color:#111">
          <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
            <h2 style="margin:0;color:#b91c1c;font-size:18px;font-weight:700">Erreur d'exécution (inattendue)</h2>
            <button aria-label="Fermer" style="background:transparent;border:0;color:#6b7280;font-size:18px;cursor:pointer" onclick="this.closest('#fatal-error-overlay')?.remove()">✕</button>
          </div>
          <div style="padding:16px 20px">
            <pre style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e5e7eb;margin:0">${message}</pre>
            ${stack ? `<details style="margin-top:8px"><summary>Stack</summary><pre style="white-space:pre-wrap;margin-top:8px">${stack}</pre></details>` : ''}
          </div>
        </div>
      </div>
    `;
  } catch (e) {
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
