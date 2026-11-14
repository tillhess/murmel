import { mix, rgba } from '../core/color';
import { PAPER } from './materials';

/**
 * Das leere Feld im Bild. Es muss auf einen Blick anders aussehen als eine Murmel (matt statt glänzend, vertieft
 * statt gewölbt) und trotzdem zeigen, welche Farbe hierher gehört. Drei Entwürfe, in den Einstellungen wählbar:
 *
 * - schale:   eine flache Schale in aufgehellter Zielfarbe mit deutlicher Vertiefung (Voreinstellung, vom
 *             Auftraggeber gewählt)
 * - ring:     eine helle Mulde mit kräftigem Farbring, in der Mitte sieht man das blasse Bild
 * - gestanzt: ein echtes Loch im Papier, dunkel und klein, mit einem breiten Kragen in der Zielfarbe
 *
 * Alle zeichnen um den Mittelpunkt (cx, cy) eines Felds der Kantenlänge `cell`. Das Licht kommt von oben links.
 */
type Ctx = CanvasRenderingContext2D;

export type HoleStyle = 'schale' | 'ring' | 'gestanzt';
/** Die Voreinstellung steht vorn. */
export const HOLE_STYLES: readonly HoleStyle[] = ['schale', 'ring', 'gestanzt'];
export const HOLE_NAMES: Record<HoleStyle, string> = { schale: 'Schälchen', ring: 'Ring', gestanzt: 'Gestanzt' };

const SHADE = '#10142a';
const LIGHT = '#fff8ea';
/** feine dunkle Linie, die helle Farben vom Papier abhebt */
const edge = (alpha: number): string => `rgba(40,34,30,${alpha})`;

function disc(x: Ctx, cx: number, cy: number, r: number): void {
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
}

/**
 * Lässt eine Kreisfläche vertieft wirken: innen oben links liegt Schatten, innen unten rechts fängt die Wand Licht.
 * Genau umgekehrt wie bei einer Murmel, deshalb liest das Auge "hinein" statt "heraus".
 */
function hollow(x: Ctx, cx: number, cy: number, r: number, shade: number, light: number): void {
  x.save();
  disc(x, cx, cy, r);
  x.clip();
  const sx = cx + r * 0.38;
  const sy = cy + r * 0.46;
  let g = x.createRadialGradient(sx, sy, r * 0.55, sx, sy, r * 1.55);
  g.addColorStop(0, rgba(SHADE, 0));
  g.addColorStop(1, rgba(SHADE, shade));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
  const lx = cx - r * 0.34;
  const ly = cy - r * 0.4;
  g = x.createRadialGradient(lx, ly, r * 0.8, lx, ly, r * 1.5);
  g.addColorStop(0, rgba(LIGHT, 0));
  g.addColorStop(1, rgba(LIGHT, light));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
  x.restore();
}

/** Ein echtes Loch: dunkel, klein, mit heller Schnittkante. Darum ein matter Kragen in der Zielfarbe. */
function punched(x: Ctx, cx: number, cy: number, cell: number, color: string): void {
  const collar = cell * 0.4;
  const r = cell * 0.225;
  x.fillStyle = color;
  disc(x, cx, cy, collar);
  x.fill();
  x.strokeStyle = edge(0.3);
  x.lineWidth = Math.max(0.75, cell * 0.022);
  disc(x, cx, cy, collar);
  x.stroke();
  // die Tiefe: gleichmäßig dunkel, ohne Glanz, damit das Loch nicht wie eine dunkle Perle wirkt
  x.fillStyle = '#17192b';
  disc(x, cx, cy, r);
  x.fill();
  hollow(x, cx, cy, r, 0.8, 0.1);
  // Schnittkante des Papiers: rundum hell, unten rechts am hellsten
  const w = Math.max(1, cell * 0.04);
  x.lineWidth = w;
  x.strokeStyle = rgba(LIGHT, 0.6);
  disc(x, cx, cy, r + w / 2);
  x.stroke();
  x.strokeStyle = rgba(LIGHT, 0.95);
  x.beginPath();
  x.arc(cx, cy, r + w / 2, Math.PI * 0.02, Math.PI * 0.72);
  x.stroke();
}

/** Ein leerer Kreis: kräftiger Ring in der Zielfarbe um eine helle Mulde, durch die das blasse Bild scheint. */
function ringed(x: Ctx, cx: number, cy: number, cell: number, color: string): void {
  const mid = cell * 0.345;
  const w = cell * 0.1;
  const inner = mid - w / 2;
  // helle Mulde: ein Schleier in Papierfarbe hebt die Mitte von dunklen Bildstellen ab
  x.fillStyle = rgba(PAPER, 0.5);
  disc(x, cx, cy, inner);
  x.fill();
  hollow(x, cx, cy, inner, 0.24, 0.36);
  x.strokeStyle = color;
  x.lineWidth = w;
  disc(x, cx, cy, mid);
  x.stroke();
  x.lineWidth = Math.max(0.75, cell * 0.02);
  x.strokeStyle = edge(0.3);
  disc(x, cx, cy, mid + w / 2);
  x.stroke();
  x.strokeStyle = edge(0.22);
  disc(x, cx, cy, inner);
  x.stroke();
}

/** Eine flache Schale in aufgehellter Zielfarbe: heller als jede Murmel dieser Farbe und sichtbar vertieft. */
function dish(x: Ctx, cx: number, cy: number, cell: number, color: string): void {
  const r = cell * 0.385;
  x.fillStyle = mix(color, PAPER, 0.42);
  disc(x, cx, cy, r);
  x.fill();
  hollow(x, cx, cy, r, 0.46, 0.6);
  // Rand in der vollen Farbe: Er sagt eindeutig, was hierher gehört
  x.lineWidth = Math.max(1.2, cell * 0.055);
  x.strokeStyle = color;
  disc(x, cx, cy, r - x.lineWidth / 2);
  x.stroke();
  x.lineWidth = Math.max(0.75, cell * 0.02);
  x.strokeStyle = edge(0.3);
  disc(x, cx, cy, r);
  x.stroke();
}

/** Zeichnet ein leeres Feld im gewählten Entwurf. */
export function hole(x: Ctx, cx: number, cy: number, cell: number, color: string, style: HoleStyle): void {
  if (style === 'gestanzt') punched(x, cx, cy, cell, color);
  else if (style === 'ring') ringed(x, cx, cy, cell, color);
  else dish(x, cx, cy, cell, color);
}
