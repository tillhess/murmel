import { t } from './i18n';

/** Das Ereignis, mit dem Chrome, Edge und Android anbieten, die Seite als App zu installieren */
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Läuft das Spiel als App vom Home-Bildschirm oder aus dem Dock? */
export function isStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return legacy || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

/** Nicht eingebettet in eine andere Seite (wie die Einzeldatei): Dann liegen die Nachbarseiten daneben. */
export function isTopLevel(): boolean {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

/** Eine eigene Seite im Browser, nicht eingebettet in eine andere */
function ownPage(): boolean {
  return isTopLevel() && /^https?:$/.test(location.protocol);
}

/** Wie man die Seite in diesem Browser von Hand zur App macht; null, wo es keinen Weg gibt oder er angeboten wird */
function manualWay(): 'ios' | 'mac' | null {
  const ua = navigator.userAgent;
  // iPadOS gibt sich als Mac aus, hat aber einen Touchscreen.
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || touchMac) return 'ios';
  if (/Macintosh/.test(ua) && /Version\/\d+.*Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua)) return 'mac';
  return null;
}

/**
 * Macht Murmel installierbar: Der Service Worker hält das Spiel für unterwegs ohne Netz bereit, und der Knopf
 * „App installieren“ erscheint, sobald der Browser einen Weg dafür kennt. Chrome, Edge und Android fragen selbst
 * nach; Safari kennt nur den Weg über das Menü, dafür zeigt der Knopf eine kurze Anleitung.
 */
export function setupInstall(button: HTMLButtonElement, hint: HTMLDialogElement): void {
  if (!ownPage()) return;

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => undefined);
  }
  if (isStandalone()) return;

  let offer: InstallPrompt | null = null;
  const way = manualWay();
  button.hidden = !way;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    offer = e as InstallPrompt;
    button.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    offer = null;
    button.hidden = true;
  });

  const text = hint.querySelector('[data-part="how"]');
  hint.querySelector('[data-part="done"]')?.addEventListener('click', () => hint.close());
  hint.addEventListener('click', (e) => {
    if (e.target === hint) hint.close();
  });

  button.addEventListener('click', async () => {
    if (offer) {
      const asked = offer;
      offer = null;
      await asked.prompt();
      const { outcome } = await asked.userChoice;
      // Abgelehnt: Chrome bietet es später von selbst wieder an, dann erscheint der Knopf erneut.
      button.hidden = outcome === 'accepted' || !way;
      return;
    }
    if (!way || hint.open) return;
    // erst beim Öffnen geschrieben: So steht die Anleitung in der Sprache, die gerade gilt.
    if (text) text.textContent = t(way === 'ios' ? 'install_ios' : 'install_mac');
    hint.showModal();
  });
}
