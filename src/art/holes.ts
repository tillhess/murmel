import { mix, rgba } from '../core/color';
import { PAPER } from './materials';

/**
 * Das leere Feld im Bild. Es muss auf einen Blick anders aussehen als eine Murmel (matt statt glänzend, vertieft
 * statt gewölbt) und zeigen, welche Farbe hierher gehört. Drei Entwürfe sind in den Einstellungen wählbar. Alle
 * liegen auf der blassen Vorzeichnung, die Farbe trägt das Zeichen selbst:
 * - schale: eine flache Schale in aufgehellter Zielfarbe mit Rand in der vollen Farbe
 * - kreuz:  dieselbe Schale, in deren Mitte ein Kreuzschlitz-Schraubendreher einen Abdruck nach unten
 *           hinterlassen hat
 * - ring:   eine helle Mulde mit kräftigem Farbring
 *
 * Alle zeichnen um den Mittelpunkt (cx, cy) eines Felds der Kantenlänge `cell`. Das Licht kommt von oben links.
 */
type Ctx = CanvasRenderingContext2D;

export type HoleStyle = 'kreuz' | 'schale' | 'ring';
/** Die Voreinstellung steht vorn. */
export const HOLE_STYLES: readonly HoleStyle[] = ['schale', 'kreuz', 'ring'];

const SHADE = '#10142a';
const LIGHT = '#fff8ea';
const DEEP = '#15172a';
/** feine dunkle Linie, die helle Farben vom Papier abhebt */
const edge = (alpha: number): string => `rgba(40,34,30,${alpha})`;

function disc(x: Ctx, cx: number, cy: number, r: number): void {
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
}

/**
 * Lässt die Fläche des aktuellen Pfads vertieft wirken: innen oben links liegt Schatten, innen unten rechts fängt
 * die Wand Licht. Genau umgekehrt wie bei einer Murmel, deshalb liest das Auge "hinein" statt "heraus".
 */
function hollowPath(x: Ctx, cx: number, cy: number, r: number, shade: number, light: number): void {
  x.save();
  x.clip();
  const sx = cx + r * 0.38;
  const sy = cy + r * 0.46;
  let g = x.createRadialGradient(sx, sy, r * 0.55, sx, sy, r * 1.55);
  g.addColorStop(0, rgba(SHADE, 0));
  g.addColorStop(1, rgba(SHADE, shade));
  x.fillStyle = g;
  x.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
  const lx = cx - r * 0.34;
  const ly = cy - r * 0.4;
  g = x.createRadialGradient(lx, ly, r * 0.8, lx, ly, r * 1.5);
  g.addColorStop(0, rgba(LIGHT, 0));
  g.addColorStop(1, rgba(LIGHT, light));
  x.fillStyle = g;
  x.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
  x.restore();
}

function hollow(x: Ctx, cx: number, cy: number, r: number, shade: number, light: number): void {
  disc(x, cx, cy, r);
  hollowPath(x, cx, cy, r, shade, light);
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

/**
 * Schale mit Druckstelle: In der Mitte der Schale hat ein Kreuzschlitz-Schraubendreher einen Abdruck hinterlassen.
 * Um den Abdruck gibt die Schale nach (weicher Schatten), das Kreuz selbst ist tief und dunkel, in der Mitte am
 * breitesten und zu den Spitzen hin schmal. Die Kanten oben links liegen im Schatten, die unten rechts fangen Licht.
 */
function pressedDish(x: Ctx, cx: number, cy: number, cell: number, color: string): void {
  dish(x, cx, cy, cell, color);

  // die Schale gibt zur Druckstelle hin nach
  const sink = x.createRadialGradient(cx, cy, cell * 0.04, cx, cy, cell * 0.27);
  sink.addColorStop(0, rgba(SHADE, 0.3));
  sink.addColorStop(1, rgba(SHADE, 0));
  x.fillStyle = sink;
  disc(x, cx, cy, cell * 0.27);
  x.fill();

  const reach = cell * 0.2; // Länge eines Arms
  const tip = cell * 0.026; // halbe Breite an der Spitze
  const waist = cell * 0.058; // Abstand der Einbuchtung zwischen zwei Armen von der Mitte
  const cross = (dx: number, dy: number): void => {
    x.beginPath();
    for (let k = 0; k < 4; k++) {
      const d = (k * Math.PI) / 2;
      const c = Math.cos(d);
      const s = Math.sin(d);
      const m = d + Math.PI / 4;
      const px = cx + dx + c * reach;
      const py = cy + dy + s * reach;
      if (k === 0) x.moveTo(px + s * tip, py - c * tip);
      else x.lineTo(px + s * tip, py - c * tip);
      x.lineTo(px - s * tip, py + c * tip);
      x.lineTo(cx + dx + Math.cos(m) * waist, cy + dy + Math.sin(m) * waist);
    }
    x.closePath();
  };
  const lip = Math.max(0.6, cell * 0.02);
  x.lineJoin = 'round';
  x.lineWidth = lip;
  // Lippe: unten rechts fängt die Kante Licht, oben links fällt sie in den Schatten
  cross(lip * 0.7, lip * 0.7);
  x.strokeStyle = rgba(LIGHT, 0.75);
  x.stroke();
  cross(-lip * 0.6, -lip * 0.6);
  x.strokeStyle = rgba(SHADE, 0.4);
  x.stroke();
  // der Abdruck selbst: tief, mit einem Rest der Farbe
  cross(0, 0);
  x.fillStyle = mix(color, DEEP, 0.8);
  x.fill();
  cross(0, 0);
  hollowPath(x, cx, cy, reach, 0.7, 0.14);
}

/** Zeichnet ein leeres Feld im gewählten Entwurf. */
export function hole(x: Ctx, cx: number, cy: number, cell: number, color: string, style: HoleStyle): void {
  switch (style) {
    case 'kreuz':
      pressedDish(x, cx, cy, cell, color);
      break;
    case 'schale':
      dish(x, cx, cy, cell, color);
      break;
    case 'ring':
      ringed(x, cx, cy, cell, color);
      break;
  }
}
