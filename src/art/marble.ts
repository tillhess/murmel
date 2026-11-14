import { luminance, mix, rgba } from '../core/color';

/**
 * Glasmurmel in drei Schichten: unten Schatten und Glaskörper, in der Mitte der farbige Kern (er dreht sich beim
 * Rollen), oben die Spiegelungen. Das Licht kommt wie im Papierschnitt von oben links.
 * Alle Funktionen zeichnen um den Mittelpunkt (cx, cy) mit Radius r.
 *
 * Wer die vielen Farbtöne der Spiegelungen als unruhig empfindet, stellt in den Einstellungen auf "ohne Spiegelung":
 * Dann ist jede Murmel eine matte Kugel in genau einer Farbe, nur sanft schattiert, damit sie rund bleibt.
 */
type Ctx = CanvasRenderingContext2D;

export type MarbleStyle = 'glas' | 'matt';
/** Die Voreinstellung steht vorn. */
export const MARBLE_STYLES: readonly MarbleStyle[] = ['glas', 'matt'];

const SHADOW = '#10142a';
const LIGHT = '#fff8ea';

export function marbleUnder(
  x: Ctx,
  cx: number,
  cy: number,
  r: number,
  color: string,
  style: MarbleStyle = 'glas',
): void {
  // Schatten nach unten rechts
  const sx = cx + r * 0.26;
  const sy = cy + r * 0.36;
  let g = x.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 1.12);
  g.addColorStop(0, rgba(SHADOW, 0.38));
  g.addColorStop(0.7, rgba(SHADOW, 0.16));
  g.addColorStop(1, rgba(SHADOW, 0));
  x.fillStyle = g;
  x.beginPath();
  x.ellipse(sx, sy, r * 1.1, r * 1.02, 0, 0, Math.PI * 2);
  x.fill();
  if (style === 'matt') {
    // matte Kugel: fast überall die reine Farbe, zum Licht hin etwas heller, zum Rand hin etwas dunkler
    g = x.createRadialGradient(cx - r * 0.32, cy - r * 0.38, r * 0.05, cx - r * 0.1, cy - r * 0.12, r * 1.1);
    g.addColorStop(0, mix(color, '#ffffff', 0.2));
    g.addColorStop(0.45, color);
    g.addColorStop(0.8, mix(color, '#000000', 0.1));
    g.addColorStop(1, mix(color, '#000000', 0.3));
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
    return;
  }
  // gebündeltes Licht im Schatten: daran erkennt man Glas
  const kx = cx + r * 0.7;
  const ky = cy + r * 0.84;
  g = x.createRadialGradient(kx, ky, 0, kx, ky, r * 0.34);
  g.addColorStop(0, rgba(mix(color, '#ffffff', 0.55), 0.6));
  g.addColorStop(1, rgba(color, 0));
  x.fillStyle = g;
  x.beginPath();
  x.arc(kx, ky, r * 0.34, 0, Math.PI * 2);
  x.fill();
  // Glaskörper: Licht tritt oben links ein und sammelt sich unten rechts
  g = x.createRadialGradient(cx + r * 0.3, cy + r * 0.34, r * 0.04, cx + r * 0.1, cy + r * 0.12, r * 1.08);
  g.addColorStop(0, mix(color, '#ffffff', 0.5));
  g.addColorStop(0.32, mix(color, '#ffffff', 0.14));
  g.addColorStop(0.72, color);
  g.addColorStop(1, mix(color, '#000000', 0.5));
  x.fillStyle = g;
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}

/** Katzenauge: drei schmale, gedrehte Farbbänder im Glas. Die matte Murmel hat keins. */
export function marbleCore(
  x: Ctx,
  cx: number,
  cy: number,
  r: number,
  color: string,
  style: MarbleStyle = 'glas',
): void {
  if (style === 'matt') return;
  // heller als das Glas; bei sehr hellen Murmeln bläulich, damit das Band sichtbar bleibt
  const light = luminance(color) > 215 ? mix(color, '#7f9dbd', 0.55) : mix(color, '#ffffff', 0.46);
  const deep = mix(color, '#000000', 0.3);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3;
    const tip: [number, number] = [cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72];
    const c1: [number, number] = [cx + Math.cos(a - 0.75) * r * 0.5, cy + Math.sin(a - 0.75) * r * 0.5];
    const c2: [number, number] = [cx + Math.cos(a - 0.2) * r * 0.36, cy + Math.sin(a - 0.2) * r * 0.36];
    const g = x.createLinearGradient(cx, cy, tip[0], tip[1]);
    g.addColorStop(0, rgba(light, 0.95));
    g.addColorStop(0.7, rgba(light, 0.55));
    g.addColorStop(1, rgba(light, 0));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(cx, cy);
    x.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1]);
    x.quadraticCurveTo(c2[0], c2[1], cx, cy);
    x.fill();
    x.strokeStyle = rgba(deep, 0.42);
    x.lineWidth = Math.max(0.4, r * 0.035);
    x.beginPath();
    x.moveTo(cx, cy);
    x.quadraticCurveTo(c2[0], c2[1], tip[0], tip[1]);
    x.stroke();
  }
}

export function marbleTop(x: Ctx, cx: number, cy: number, r: number, color: string, style: MarbleStyle = 'glas'): void {
  const circle = () => {
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
  };
  if (style === 'matt') {
    // nur ein feiner dunkler Rand, der die Kugel von ähnlich hellem Grund abhebt
    x.strokeStyle = rgba(mix(color, '#000000', 0.55), 0.4);
    x.lineWidth = Math.max(0.6, r * 0.05);
    x.beginPath();
    x.arc(cx, cy, r * 0.985, 0, Math.PI * 2);
    x.stroke();
    return;
  }
  // Glas über dem Kern: zum Rand und nach oben dunkler, so liegt der Kern im Glas
  let g = x.createRadialGradient(cx + r * 0.18, cy + r * 0.22, r * 0.3, cx, cy, r);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(mix(color, '#000000', 0.45), 0.6));
  x.fillStyle = g;
  circle();
  x.fill();
  const top = x.createLinearGradient(cx, cy - r, cx, cy + r * 0.15);
  top.addColorStop(0, rgba(mix(color, '#000000', 0.45), 0.32));
  top.addColorStop(1, rgba(color, 0));
  x.fillStyle = top;
  circle();
  x.fill();
  // Fensterspiegelung oben links
  x.save();
  x.translate(cx - r * 0.36, cy - r * 0.42);
  x.rotate(-0.75);
  x.scale(1, 0.55);
  g = x.createRadialGradient(0, 0, 0, 0, 0, r * 0.34);
  g.addColorStop(0, rgba(LIGHT, 0.86));
  g.addColorStop(0.55, rgba(LIGHT, 0.4));
  g.addColorStop(1, rgba(LIGHT, 0));
  x.fillStyle = g;
  x.beginPath();
  x.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  x.fill();
  x.restore();
  x.lineCap = 'round';
  // Lichtbogen am Rand oben links
  x.strokeStyle = rgba(LIGHT, 0.22);
  x.lineWidth = r * 0.05;
  x.beginPath();
  x.arc(cx, cy, r * 0.82, Math.PI * 1.02, Math.PI * 1.42);
  x.stroke();
  // gebrochenes Licht am Rand unten rechts
  x.strokeStyle = rgba(mix(color, '#ffffff', 0.65), 0.42);
  x.lineWidth = r * 0.07;
  x.beginPath();
  x.arc(cx, cy, r * 0.9, Math.PI * 0.08, Math.PI * 0.5);
  x.stroke();
  // scharfer Glanzpunkt
  // (klein und weich: viele Murmeln nebeneinander sollen ruhig wirken, nicht glitzern)
  x.fillStyle = rgba(LIGHT, 0.7);
  x.beginPath();
  x.arc(cx - r * 0.44, cy - r * 0.5, r * 0.055, 0, Math.PI * 2);
  x.fill();
  // dunkler Glasrand
  x.strokeStyle = rgba(mix(color, '#000000', 0.55), 0.45);
  x.lineWidth = Math.max(0.6, r * 0.05);
  x.beginPath();
  x.arc(cx, cy, r * 0.985, 0, Math.PI * 2);
  x.stroke();
}

/** Ganze Murmel; `turn` dreht den Kern (Bogenmaß). */
export function marble(
  x: Ctx,
  cx: number,
  cy: number,
  r: number,
  color: string,
  turn = 0,
  style: MarbleStyle = 'glas',
): void {
  marbleUnder(x, cx, cy, r, color, style);
  x.save();
  x.translate(cx, cy);
  x.rotate(turn);
  marbleCore(x, 0, 0, r, color, style);
  x.restore();
  marbleTop(x, cx, cy, r, color, style);
}

/**
 * Mulde: eine flache Vertiefung, in der eine Murmel liegen kann. Innen dunkler mit Schatten oben links,
 * unten rechts eine Lichtkante; am Grund schimmert die Farbe, die hierher gehört.
 */
export function dimple(x: Ctx, cx: number, cy: number, r: number, color: string): void {
  const circle = () => {
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
  };
  x.fillStyle = mix(color, '#000000', 0.6);
  circle();
  x.fill();
  const floor = x.createRadialGradient(cx + r * 0.2, cy + r * 0.28, 0, cx + r * 0.2, cy + r * 0.28, r * 0.95);
  floor.addColorStop(0, mix(color, '#000000', 0.06));
  floor.addColorStop(0.55, mix(color, '#000000', 0.34));
  floor.addColorStop(1, rgba(color, 0));
  x.fillStyle = floor;
  circle();
  x.fill();
  const shade = x.createLinearGradient(cx - r, cy - r, cx + r * 0.25, cy + r * 0.25);
  shade.addColorStop(0, rgba(SHADOW, 0.6));
  shade.addColorStop(1, rgba(SHADOW, 0));
  x.fillStyle = shade;
  circle();
  x.fill();
  x.lineWidth = Math.max(0.6, r * 0.14);
  x.strokeStyle = rgba(LIGHT, 0.4);
  x.beginPath();
  x.arc(cx, cy, r, Math.PI * 0.02, Math.PI * 0.78);
  x.stroke();
  x.strokeStyle = rgba(SHADOW, 0.3);
  x.beginPath();
  x.arc(cx, cy, r, Math.PI * 1.02, Math.PI * 1.78);
  x.stroke();
}

/** Weicher Lichtschein, etwa wenn eine Murmel einrastet. */
export function glint(x: Ctx, cx: number, cy: number, radius: number, alpha: number): void {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, rgba(LIGHT, alpha));
  g.addColorStop(1, rgba(LIGHT, 0));
  x.fillStyle = g;
  x.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}
