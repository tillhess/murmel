import { mix, rgba } from '../core/color';
import { makeRng } from '../core/random';
import { grainCanvas } from './paint';

type Ctx = CanvasRenderingContext2D;

/** Farbe des Papiers, auf dem jedes Bild liegt. */
export const PAPER = '#f6f1e6';
/** Helles Ahornholz der Ablage und seine Maserung. */
export const WOOD = '#e6cba0';
export const WOOD_GRAIN = '#b88d58';

export function roundedRect(x: Ctx, px: number, py: number, w: number, h: number, r: number): void {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

/** Ein Blatt Papier mit weichem Schatten und Korn. `dpr` gleicht aus, dass Schatten nicht mitskalieren. */
export function paperSheet(x: Ctx, px: number, py: number, w: number, h: number, dpr: number): void {
  x.save();
  x.shadowColor = 'rgba(8,10,28,0.36)';
  x.shadowBlur = 34 * dpr;
  x.shadowOffsetY = 16 * dpr;
  x.fillStyle = PAPER;
  roundedRect(x, px, py, w, h, 2.5);
  x.fill();
  x.restore();
  x.save();
  roundedRect(x, px, py, w, h, 2.5);
  x.clip();
  // Licht fällt von oben links aufs Blatt
  const g = x.createLinearGradient(px, py, px + w, py + h);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(60,50,40,0.08)');
  x.fillStyle = g;
  x.fillRect(px, py, w, h);
  // Korn als "overlay": hellt und dunkelt gleichmäßig, das Papier bleibt warmweiß
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = 0.45;
  x.fillStyle = x.createPattern(grainCanvas(), 'repeat') as CanvasPattern;
  x.fillRect(px, py, w, h);
  x.restore();
}

/** Vier schmale Ahornleisten mit Gehrung; die Maserung folgt jeder einzelnen Leiste. */
export function woodFrame(x: Ctx, px: number, py: number, w: number, h: number, rim: number): void {
  const rng = makeRng(31);
  x.save();
  x.translate(px, py);
  for (let side = 0; side < 4; side++) {
    const length = side % 2 === 0 ? w : h;
    x.save();
    if (side === 1) x.translate(w, 0);
    else if (side === 2) x.translate(w, h);
    else if (side === 3) x.translate(0, h);
    x.rotate((side * Math.PI) / 2);
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(length, 0);
    x.lineTo(length - rim, rim);
    x.lineTo(rim, rim);
    x.closePath();
    x.clip();
    const g = x.createLinearGradient(0, 0, 0, rim);
    g.addColorStop(0, mix(WOOD, '#fff8e8', 0.35));
    g.addColorStop(0.18, WOOD);
    g.addColorStop(0.78, mix(WOOD, WOOD_GRAIN, 0.25));
    g.addColorStop(1, mix(WOOD_GRAIN, '#4e3421', 0.22));
    x.fillStyle = g;
    x.fillRect(0, 0, length, rim);
    x.lineWidth = 0.5;
    for (let line = 0; line < 9; line++) {
      const y = rng() * rim;
      const phase = rng() * Math.PI * 2;
      x.strokeStyle = rgba(WOOD_GRAIN, 0.13 + rng() * 0.2);
      x.beginPath();
      for (let at = 0; at <= length; at += 4) {
        const grain = y + Math.sin(at * 0.026 + phase) * 0.7;
        if (at === 0) x.moveTo(at, grain);
        else x.lineTo(at, grain);
      }
      x.stroke();
    }
    x.restore();
  }
  // Die dunkle Innenkante gibt der schmalen Leiste fühlbare Höhe.
  x.strokeStyle = 'rgba(74,48,25,0.26)';
  x.lineWidth = 1;
  x.strokeRect(rim + 0.5, rim + 0.5, w - 2 * rim - 1, h - 2 * rim - 1);
  x.strokeStyle = 'rgba(255,249,232,0.55)';
  x.strokeRect(0.5, 0.5, w - 1, h - 1);
  x.restore();
}

/** Die Ablage: ein helles Holzbrett mit ruhiger Maserung. Die Mulden zeichnet die Ansicht darüber. */
export function woodBoard(x: Ctx, w: number, h: number, dpr: number): void {
  const rng = makeRng(9);
  const radius = Math.min(14, h / 4);
  x.save();
  x.shadowColor = 'rgba(8,10,28,0.34)';
  x.shadowBlur = 22 * dpr;
  x.shadowOffsetY = 10 * dpr;
  x.fillStyle = WOOD;
  roundedRect(x, 0, 0, w, h, radius);
  x.fill();
  x.restore();
  x.save();
  roundedRect(x, 0, 0, w, h, radius);
  x.clip();
  const lg = x.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, mix(WOOD, '#ffffff', 0.22));
  lg.addColorStop(1, mix(WOOD, '#3a2a18', 0.1));
  x.fillStyle = lg;
  x.fillRect(0, 0, w, h);
  // Maserung: wenige, lange, leicht gewellte Linien, immer der Länge des Bretts nach
  x.lineCap = 'round';
  x.save();
  const upright = h > w;
  const long = upright ? h : w;
  const short = upright ? w : h;
  if (upright) {
    x.translate(w, 0);
    x.rotate(Math.PI / 2);
  }
  for (let i = 0; i < 26; i++) {
    const y0 = rng() * short;
    const amp = 1 + rng() * 3.5;
    const f = 0.003 + rng() * 0.008;
    const ph = rng() * 6;
    x.strokeStyle = rgba(WOOD_GRAIN, 0.1 + rng() * 0.2);
    x.lineWidth = 0.7 + rng() * 1.6;
    x.beginPath();
    for (let px = -4; px <= long + 4; px += 6) {
      const y = y0 + Math.sin(px * f + ph) * amp + Math.sin(px * f * 3.1 + ph * 2) * amp * 0.3;
      if (px < 0) x.moveTo(px, y);
      else x.lineTo(px, y);
    }
    x.stroke();
  }
  x.restore();
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = 0.3;
  x.fillStyle = x.createPattern(grainCanvas(), 'repeat') as CanvasPattern;
  x.fillRect(0, 0, w, h);
  x.restore();
  // Kante: oben fängt das Brett Licht
  x.strokeStyle = 'rgba(255,255,255,0.6)';
  x.lineWidth = 1;
  roundedRect(x, 0.5, 0.5, w - 1, h - 1, radius);
  x.stroke();
}
