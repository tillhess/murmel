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

/** Eine eigene Seite im Browser, nicht eingebettet in eine andere (wie die Einzeldatei) */
function ownPage(): boolean {
  try {
    return window.self === window.top && /^https?:$/.test(location.protocol);
  } catch {
    return false;
  }
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

const HINTS = {
  ios: 'Tippe auf das Teilen-Symbol (auf dem iPhone steckt es unter „…“) und dann auf „Zum Home-Bildschirm“. Murmel startet danach wie eine App, ohne Adressleiste, und läuft auch ohne Netz.',
  mac: 'Wähle in Safari oben im Menü „Ablage“ und dann „Zum Dock hinzufügen“. Murmel startet danach wie eine App und läuft auch ohne Netz.',
} as const;

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
  if (text && way) text.textContent = HINTS[way];
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
    if (way && !hint.open) hint.showModal();
  });
}
