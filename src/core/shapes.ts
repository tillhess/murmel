import { makeRng } from './random';
import type { Pt, Shape } from './scene';

/**
 * Bausteine für Motive. Alle Formen wirken wie mit der Schere aus Papier geschnitten: einfache Umrisse,
 * leicht unregelmäßig. Koordinaten im Einheitsquadrat (x nach rechts, y nach unten).
 */

export const poly = (...pts: Pt[]): Shape => ({ kind: 'poly', pts });

export const ellipse = (cx: number, cy: number, rx: number, ry: number = rx, rot = 0): Shape => ({
  kind: 'ellipse',
  cx,
  cy,
  rx,
  ry,
  rot,
});

export const rect = (x0: number, y0: number, x1: number, y1: number): Shape =>
  poly([x0, y0], [x1, y0], [x1, y1], [x0, y1]);

export interface RidgeOptions {
  /** mittlere Höhe der Kammlinie (0 = oben, 1 = unten) */
  readonly y: number;
  /** wie hoch die Wellen ausschlagen */
  readonly amp: number;
  /** Anzahl großer Wellen über die Bildbreite */
  readonly waves: number;
  readonly phase?: number;
  /** Anteil kleiner, schnellerer Wellen: 0 = sanfte Hügel, 1 = zackige Berge */
  readonly rough?: number;
  /** Neigung der ganzen Linie: positiv fällt nach rechts ab */
  readonly tilt?: number;
}

/** Hügel- oder Bergkette: alles unterhalb einer gewellten Linie bis zum unteren Bildrand. */
export function ridge({ y, amp, waves, phase = 0, rough = 0.3, tilt = 0 }: RidgeOptions): Shape {
  const pts: Pt[] = [];
  const steps = 48;
  for (let k = 0; k <= steps; k++) {
    const x = -0.02 + (1.04 * k) / steps;
    const a = x * waves * Math.PI * 2 + phase;
    const wave =
      Math.sin(a) * (1 - rough * 0.5) +
      Math.sin(a * 2.3 + phase * 1.7) * rough * 0.6 +
      Math.sin(a * 5.1) * rough * 0.25;
    pts.push([x, y + (x - 0.5) * tilt - wave * amp]);
  }
  pts.push([1.02, 1.02], [-0.02, 1.02]);
  return { kind: 'poly', pts };
}

/** Waagerechtes Band zwischen zwei Höhen, mit leicht gewellten Kanten (Wasserstreifen, Nebel, Wolkenbank). */
export function band(y0: number, y1: number, wave = 0.006, waves = 3, phase = 0): Shape {
  const pts: Pt[] = [];
  const steps = 24;
  for (let k = 0; k <= steps; k++) {
    const x = -0.02 + (1.04 * k) / steps;
    pts.push([x, y0 + Math.sin(x * waves * Math.PI * 2 + phase) * wave]);
  }
  for (let k = steps; k >= 0; k--) {
    const x = -0.02 + (1.04 * k) / steps;
    pts.push([x, y1 + Math.sin(x * waves * Math.PI * 2 + phase + 1.3) * wave]);
  }
  return { kind: 'poly', pts };
}

export interface BlobOptions {
  /** Unregelmäßigkeit des Umrisses, 0 = Kreis */
  readonly wobble?: number;
  /** Höhe relativ zur Breite */
  readonly squash?: number;
  readonly rot?: number;
  readonly seed?: number;
}

/** Rundliche, leicht unregelmäßige Form: Wolke, Laubkrone, Lichtfleck. */
export function blob(
  cx: number,
  cy: number,
  r: number,
  { wobble = 0.12, squash = 1, rot = 0, seed = 1 }: BlobOptions = {},
): Shape {
  const rng = makeRng(seed);
  const p1 = rng() * 6.28;
  const p2 = rng() * 6.28;
  const pts: Pt[] = [];
  const steps = 28;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2;
    const rad = r * (1 + wobble * Math.sin(a * 3 + p1) + wobble * 0.6 * Math.sin(a * 5 + p2));
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad * squash;
    pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  return { kind: 'poly', pts };
}

/** Seerosenblatt: Kreis mit keilförmiger Kerbe in Richtung `notch` (Bogenmaß). */
export function lilyPad(cx: number, cy: number, r: number, notch: number, gap = 0.45): Shape {
  const pts: Pt[] = [[cx, cy]];
  const steps = 26;
  for (let k = 0; k <= steps; k++) {
    const a = notch + gap / 2 + ((Math.PI * 2 - gap) * k) / steps;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return { kind: 'poly', pts };
}

/** Stamm: schmales Viereck von oben nach unten, auf Wunsch geneigt und nach oben verjüngt. */
export function trunk(x: number, width: number, lean = 0, top = -0.02, bottom = 1.02, taper = 0.8): Shape {
  const wt = (width * taper) / 2;
  const wb = width / 2;
  return poly([x + lean - wt, top], [x + lean + wt, top], [x + wb, bottom], [x - wb, bottom]);
}

/** Tanne als Silhouette: Dreieck auf kurzem Fuß. */
export function fir(x: number, base: number, height: number, width: number): Shape {
  return poly([x, base - height], [x + width / 2, base], [x - width / 2, base]);
}

/** Blüte: Stern aus spitzen Blättern. */
export function blossom(cx: number, cy: number, r: number, petals = 7, rot = 0): Shape {
  const pts: Pt[] = [];
  for (let k = 0; k < petals * 2; k++) {
    const a = rot + (k / (petals * 2)) * Math.PI * 2;
    const rad = k % 2 === 0 ? r : r * 0.5;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return { kind: 'poly', pts };
}
