import { mix, rgba } from '../core/color';
import { makeRng } from '../core/random';
import { PAPER } from './materials';

/**
 * Das leere Feld im Bild. Es muss auf einen Blick anders aussehen als eine Murmel (matt statt glänzend, vertieft
 * statt gewölbt) und zeigen, welche Farbe hierher gehört. Mehrere Entwürfe sind in den Einstellungen wählbar.
 *
 * Auf der blassen Vorzeichnung, die Farbe trägt das Zeichen selbst:
 * - gestanzt: ein dunkles Loch mit heller Schnittkante in einem breiten Kragen in der Zielfarbe
 * - schale:   eine flache Schale in aufgehellter Zielfarbe mit Rand in der vollen Farbe
 * - ring:     eine helle Mulde mit kräftigem Farbring
 *
 * Im fertigen Bild: Unter dem leeren Feld liegt schon das Bild in voller Farbe (siehe `showsPicture`), das Zeichen
 * ist nur noch die Öffnung darin. So ist die Farbe so deutlich wie möglich.
 * - bild:  ein rundes, dunkles Loch mit heller Schnittkante
 * - kreuz: ein Kreuzschnitt, dessen vier Lappen nach innen gedrückt sind
 * - riss:  ein gerissenes, gezacktes Loch mit feinen Sprüngen
 *
 * Alle zeichnen um den Mittelpunkt (cx, cy) eines Felds der Kantenlänge `cell`. Das Licht kommt von oben links.
 */
type Ctx = CanvasRenderingContext2D;

export type HoleStyle = 'gestanzt' | 'bild' | 'kreuz' | 'riss' | 'schale' | 'ring';
/** Die Voreinstellung steht vorn. */
export const HOLE_STYLES: readonly HoleStyle[] = ['gestanzt', 'bild', 'kreuz', 'riss', 'schale', 'ring'];
export const HOLE_NAMES: Record<HoleStyle, string> = {
  gestanzt: 'Gestanzt',
  bild: 'Im Bild',
  kreuz: 'Kreuz',
  riss: 'Gerissen',
  schale: 'Schälchen',
  ring: 'Ring',
};

/** Liegt bei diesem Entwurf unter dem leeren Feld schon das fertige Bild? */
export const showsPicture = (style: HoleStyle): boolean => style === 'bild' || style === 'kreuz' || style === 'riss';

/** So viele verschiedene Formen hat ein Entwurf. Gerissene Löcher sollen nicht alle gleich aussehen. */
export const holeVariants = (style: HoleStyle): number => (style === 'riss' ? 4 : 1);

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

/** Rundes, dunkles Loch mit heller Schnittkante: rundum hell, unten rechts am hellsten. */
function roundHole(x: Ctx, cx: number, cy: number, r: number, cell: number): void {
  // gleichmäßig dunkel, ohne Glanz, damit das Loch nicht wie eine dunkle Perle wirkt
  x.fillStyle = DEEP;
  disc(x, cx, cy, r);
  x.fill();
  hollow(x, cx, cy, r, 0.85, 0.1);
  const w = Math.max(1, cell * 0.045);
  x.lineWidth = w;
  x.strokeStyle = rgba(LIGHT, 0.62);
  disc(x, cx, cy, r + w / 2);
  x.stroke();
  x.strokeStyle = rgba(LIGHT, 0.97);
  x.beginPath();
  x.arc(cx, cy, r + w / 2, Math.PI * 0.02, Math.PI * 0.72);
  x.stroke();
  // feine dunkle Linie außen: Sie hält die helle Kante auch auf hellem Grund sichtbar
  x.lineWidth = Math.max(0.6, cell * 0.016);
  x.strokeStyle = edge(0.34);
  disc(x, cx, cy, r + w);
  x.stroke();
}

/** Ein echtes Loch: dunkel, klein, mit heller Schnittkante. Darum ein matter Kragen in der Zielfarbe. */
function punched(x: Ctx, cx: number, cy: number, cell: number, color: string): void {
  const collar = cell * 0.4;
  x.fillStyle = color;
  disc(x, cx, cy, collar);
  x.fill();
  x.strokeStyle = edge(0.3);
  x.lineWidth = Math.max(0.75, cell * 0.022);
  disc(x, cx, cy, collar);
  x.stroke();
  roundHole(x, cx, cy, cell * 0.225, cell);
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
 * Kreuzschnitt: Das Papier ist über Kreuz eingeschnitten, die vier Lappen sind zur Mitte hin eingedrückt, wie der
 * Schlitz im Deckel eines Bechers. Die Lappen oben und links liegen im Schatten, die unten und rechts fangen Licht.
 * Zwischen den Lappen klafft ein dunkler Stern, in der Mitte am breitesten.
 */
function crossCut(x: Ctx, cx: number, cy: number, cell: number): void {
  const a = cell * 0.3; // halbe Kantenlänge des eingeschnittenen Quadrats
  const flap = (ax: number, ay: number, bx: number, by: number, fill: string): void => {
    x.fillStyle = fill;
    x.beginPath();
    x.moveTo(cx + ax, cy + ay);
    x.lineTo(cx + bx, cy + by);
    x.lineTo(cx, cy);
    x.closePath();
    x.fill();
  };
  flap(-a, -a, a, -a, rgba(SHADE, 0.3)); // oben
  flap(-a, -a, -a, a, rgba(SHADE, 0.2)); // links
  flap(a, -a, a, a, rgba(LIGHT, 0.2)); // rechts
  flap(-a, a, a, a, rgba(LIGHT, 0.3)); // unten

  // der Spalt: vier schmale Arme entlang der Schnitte, zur Mitte hin breiter
  const tip = a * 1.04 * Math.SQRT2;
  const waist = cell * 0.075;
  x.beginPath();
  for (let k = 0; k < 4; k++) {
    const d = Math.PI / 4 + (k * Math.PI) / 2; // Richtung eines Schnitts
    const m = d + Math.PI / 4; // Richtung der Einbuchtung zwischen zwei Armen
    const px = cx + Math.cos(d) * tip;
    const py = cy + Math.sin(d) * tip;
    if (k === 0) x.moveTo(px, py);
    else x.lineTo(px, py);
    x.lineTo(cx + Math.cos(m) * waist, cy + Math.sin(m) * waist);
  }
  x.closePath();
  x.fillStyle = DEEP;
  x.fill();
  // helle Schnittkante, damit das Kreuz auch auf dunklen Farben steht
  x.lineJoin = 'round';
  x.lineWidth = Math.max(0.8, cell * 0.028);
  x.strokeStyle = rgba(LIGHT, 0.8);
  x.stroke();
  x.lineWidth = Math.max(0.5, cell * 0.012);
  x.strokeStyle = edge(0.4);
  x.stroke();
}

/**
 * Gerissenes Loch: ein gezackter, unregelmäßiger Umriss, als wäre das Papier durchstoßen worden, mit heller
 * Risskante und ein paar feinen Sprüngen, die von den Zacken ausgehen. `variant` wählt eine von mehreren Formen.
 */
function torn(x: Ctx, cx: number, cy: number, cell: number, variant: number): void {
  const rng = makeRng(101 + variant * 37);
  // Unregelmäßig wie ein echter Riss: ungleiche Winkel, ein paar lange Zacken, dazwischen stumpfe Ecken.
  const count = 9 + (variant % 3);
  const start = rng() * Math.PI * 2;
  const steps = Array.from({ length: count }, () => 0.6 + rng());
  const total = steps.reduce((sum, v) => sum + v, 0);
  const pts: [number, number, number][] = [];
  let turned = 0;
  for (let k = 0; k < count; k++) {
    const angle = start + (turned / total) * Math.PI * 2;
    turned += steps[k];
    // jede zweite Ecke ist eher Zacke, aber nicht jede gleich lang
    const spike = k % 2 === 0 ? 0.26 + rng() * 0.1 : 0.16 + rng() * 0.07;
    pts.push([cx + Math.cos(angle) * cell * spike, cy + Math.sin(angle) * cell * spike, angle]);
  }
  const outline = (): void => {
    x.beginPath();
    pts.forEach(([px, py], k) => {
      if (k === 0) x.moveTo(px, py);
      else x.lineTo(px, py);
    });
    x.closePath();
  };
  // feine Sprünge im Papier, ausgehend von einigen Zacken
  x.lineCap = 'round';
  x.strokeStyle = edge(0.5);
  x.lineWidth = Math.max(0.6, cell * 0.018);
  for (let k = 0; k < pts.length; k += 2) {
    if (rng() < 0.35) continue;
    const [px, py, angle] = pts[k];
    const bend = angle + (rng() - 0.5) * 0.9;
    const len = cell * (0.07 + rng() * 0.09);
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(bend) * len, py + Math.sin(bend) * len);
    x.stroke();
  }
  outline();
  x.fillStyle = DEEP;
  x.fill();
  outline();
  hollowPath(x, cx, cy, cell * 0.36, 0.8, 0.08);
  // Risskante: hell, weil man in die Dicke des Papiers sieht
  outline();
  x.lineJoin = 'miter';
  x.lineWidth = Math.max(1, cell * 0.04);
  x.strokeStyle = rgba(LIGHT, 0.85);
  x.stroke();
  outline();
  x.lineWidth = Math.max(0.5, cell * 0.012);
  x.strokeStyle = edge(0.45);
  x.stroke();
}

/** Zeichnet ein leeres Feld im gewählten Entwurf. `variant` zählt ab 0 (siehe `holeVariants`). */
export function hole(x: Ctx, cx: number, cy: number, cell: number, color: string, style: HoleStyle, variant = 0): void {
  switch (style) {
    case 'gestanzt':
      punched(x, cx, cy, cell, color);
      break;
    case 'ring':
      ringed(x, cx, cy, cell, color);
      break;
    case 'schale':
      dish(x, cx, cy, cell, color);
      break;
    case 'bild':
      roundHole(x, cx, cy, cell * 0.27, cell);
      break;
    case 'kreuz':
      crossCut(x, cx, cy, cell);
      break;
    case 'riss':
      torn(x, cx, cy, cell, variant);
      break;
  }
}
