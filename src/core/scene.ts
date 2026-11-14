import { type Level, makeLevel } from './level';

/**
 * Ein Motiv als Daten: eine Palette und übereinanderliegende Formen ("Papierlagen"), jede in einer Palettenfarbe.
 * Aus denselben Daten entstehen das Zielraster für die Murmeln (hier, reine Geometrie) und das gemalte Bild (src/art).
 * Koordinaten liegen im Einheitsquadrat: x nach rechts, y nach unten, jeweils 0 bis 1.
 */
export type Pt = readonly [number, number];

export type Shape =
  | { readonly kind: 'poly'; readonly pts: readonly Pt[] }
  | {
      readonly kind: 'ellipse';
      readonly cx: number;
      readonly cy: number;
      readonly rx: number;
      readonly ry: number;
      readonly rot?: number;
    };

export interface Layer {
  /** Index in die Palette der Szene */
  readonly color: number;
  /**
   * Feine Einzelheit in einer eigenen Farbe (Auge, Spiegelung, Rindenmal). Sie gehört nur zum gemalten Bild:
   * Für das Murmelraster zählt sie nicht und taucht erst auf, wenn die Fläche fertig ist.
   */
  readonly ink?: string;
  /** 'full' füllt das ganze Bild (Hintergrund) */
  readonly shape: Shape | 'full';
  /** Wie weit die Lage über dem Untergrund schwebt: bestimmt ihren Schattenwurf, 0 = liegt flach auf. */
  readonly lift?: number;
  /** Verlauf innerhalb der Lage: Richtung in Grad (0 = nach rechts, 90 = nach unten) und Stärke 0..1. */
  readonly shade?: { readonly angle: number; readonly amount: number };
}

/** Stimmung rund um das Bild: Verlauf des Hintergrunds und Farbe für Schrift und Linien. */
export interface Mood {
  readonly top: string;
  readonly bottom: string;
  readonly ink: string;
  /** Grundton für den Klang dieses Bildes (MIDI-Nummer) */
  readonly root: number;
}

export interface Scene {
  readonly id: string;
  readonly name: string;
  /** Rasterbreite und -höhe in Feldern */
  readonly size: number;
  readonly palette: readonly string[];
  readonly layers: readonly Layer[];
  readonly mood: Mood;
}

function inPolygon(pts: readonly Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Liegt der Punkt (x, y) in der Form? */
export function inShape(shape: Shape | 'full', x: number, y: number): boolean {
  if (shape === 'full') return true;
  if (shape.kind === 'poly') return inPolygon(shape.pts, x, y);
  const cos = Math.cos(-(shape.rot ?? 0));
  const sin = Math.sin(-(shape.rot ?? 0));
  const dx = x - shape.cx;
  const dy = y - shape.cy;
  const u = (dx * cos - dy * sin) / shape.rx;
  const v = (dx * sin + dy * cos) / shape.ry;
  return u * u + v * v <= 1;
}

function bounds(shape: Shape | 'full'): [number, number, number, number] {
  if (shape === 'full') return [0, 0, 1, 1];
  if (shape.kind === 'ellipse') {
    const r = Math.max(shape.rx, shape.ry);
    return [shape.cx - r, shape.cy - r, shape.cx + r, shape.cy + r];
  }
  let x0 = Number.POSITIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  for (const [x, y] of shape.pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

/**
 * Zielraster eines Motivs: Jedes Feld bekommt die Farbe, die in ihm die größte Fläche einnimmt
 * (ermittelt über samples × samples Stichproben je Feld). Felder ohne jede Lage bleiben -1.
 */
export function rasterize(scene: Scene, samples = 4): Int16Array {
  const n = scene.size;
  const layers = scene.layers.filter((l) => l.ink === undefined);
  const boxes = layers.map((l) => bounds(l.shape));
  const target = new Int16Array(n * n).fill(-1);
  const tally = new Int32Array(scene.palette.length);
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      tally.fill(0);
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = (gx + (sx + 0.5) / samples) / n;
          const y = (gy + (sy + 0.5) / samples) / n;
          for (let k = layers.length - 1; k >= 0; k--) {
            const b = boxes[k];
            if (x < b[0] || y < b[1] || x > b[2] || y > b[3]) continue;
            if (inShape(layers[k].shape, x, y)) {
              tally[layers[k].color]++;
              break;
            }
          }
        }
      }
      let best = -1;
      let most = 0;
      for (let c = 0; c < tally.length; c++) {
        if (tally[c] > most) {
          most = tally[c];
          best = c;
        }
      }
      target[gy * n + gx] = best;
    }
  }
  return target;
}

export function sceneLevel(scene: Scene): Level {
  return makeLevel(scene.name, scene.size, scene.size, scene.palette, rasterize(scene));
}

/** Anteil jeder Palettenfarbe am Raster (0..1). */
export function colorShares(level: Level): number[] {
  const n = new Array<number>(level.palette.length).fill(0);
  for (const i of level.cells) n[level.target[i]]++;
  return n.map((v) => v / level.cells.length);
}
