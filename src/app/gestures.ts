/**
 * Berührungen auf dem Spielbrett. Ein kurzer Tipp wählt oder zielt. Zwei Finger im Bild vergrößern es und nehmen es
 * mit; ist es vergrößert, verschiebt es auch ein einzelner Finger. Das Holzbrett macht dabei nie mit.
 *
 * Ein Tipp gilt erst beim Loslassen: Nur so lässt sich unterscheiden, ob jemand tippen oder ziehen wollte, und der
 * erste Finger einer Zwei-Finger-Geste wählt nicht versehentlich eine Murmel.
 */
export interface GestureTarget {
  /** Liegt der Punkt im Bildrahmen? Nur dort beginnt Vergrößern oder Verschieben. */
  inPicture(clientX: number, clientY: number): boolean;
  readonly zoomed: boolean;
  zoomAt(factor: number, clientX: number, clientY: number): void;
  /** Zwei Finger: Ihr Mittelpunkt wandert von (fromX, fromY) nach (toX, toY), ihr Abstand wächst um `factor`. */
  pinch(factor: number, fromX: number, fromY: number, toX: number, toY: number): void;
  panBy(dx: number, dy: number): void;
  /** Die Geste ist vorbei: Jetzt darf nachgeschärft werden. */
  settle(): void;
}

interface Finger {
  x: number;
  y: number;
  startX: number;
  startY: number;
  /** hat sich so weit bewegt (oder war Teil einer Zwei-Finger-Geste), dass es kein Tipp mehr ist */
  moved: boolean;
  inPicture: boolean;
}

/** Ab dieser Strecke in Bildschirmpunkten ist eine Berührung kein Tipp mehr, sondern ein Ziehen. */
const SLOP = 10;

export function watchGestures(
  canvas: HTMLCanvasElement,
  target: GestureTarget,
  onTap: (clientX: number, clientY: number) => void,
): void {
  const fingers = new Map<number, Finger>();
  let pinch: { dist: number; cx: number; cy: number } | null = null;
  let wheelTimer = 0;

  const pair = (): [Finger, Finger] | null => {
    const [a, b] = fingers.values();
    return a && b ? [a, b] : null;
  };
  const measure = (a: Finger, b: Finger) => ({
    dist: Math.hypot(a.x - b.x, a.y - b.y),
    cx: (a.x + b.x) / 2,
    cy: (a.y + b.y) / 2,
  });

  canvas.addEventListener('pointerdown', (e) => {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ohne Zeigerfang geht es auch, die Geste endet dann am Rand der Zeichenfläche
    }
    fingers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      inPicture: target.inPicture(e.clientX, e.clientY),
    });
    const two = pair();
    if (two) {
      // Zwei Finger: Das ist kein Tipp mehr, für keinen der beiden.
      for (const f of fingers.values()) f.moved = true;
      const now = measure(two[0], two[1]);
      pinch = target.inPicture(now.cx, now.cy) ? now : null;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const f = fingers.get(e.pointerId);
    if (!f) return;
    const dx = e.clientX - f.x;
    const dy = e.clientY - f.y;
    f.x = e.clientX;
    f.y = e.clientY;
    const two = pair();
    if (two && pinch) {
      const now = measure(two[0], two[1]);
      const factor = pinch.dist > 0 && now.dist > 0 ? now.dist / pinch.dist : 1;
      target.pinch(factor, pinch.cx, pinch.cy, now.cx, now.cy);
      pinch = now;
      return;
    }
    if (!f.moved && Math.hypot(e.clientX - f.startX, e.clientY - f.startY) > SLOP) f.moved = true;
    if (f.moved && f.inPicture && target.zoomed && fingers.size === 1) target.panBy(dx, dy);
  });

  const lift = (e: PointerEvent, tap: boolean): void => {
    const f = fingers.get(e.pointerId);
    if (!f) return;
    fingers.delete(e.pointerId);
    if (fingers.size < 2) pinch = null;
    if (tap && !f.moved) onTap(e.clientX, e.clientY);
    if (fingers.size === 0) target.settle();
  };
  canvas.addEventListener('pointerup', (e) => lift(e, true));
  canvas.addEventListener('pointercancel', (e) => lift(e, false));

  // Maus und Trackpad: Das Rad (oder die Zwei-Finger-Spreizgeste, die als Rad mit Strg ankommt) vergrößert
  // um die Stelle unter dem Zeiger.
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!target.inPicture(e.clientX, e.clientY)) return;
      e.preventDefault();
      target.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022)), e.clientX, e.clientY);
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => target.settle(), 180);
    },
    { passive: false },
  );
}
