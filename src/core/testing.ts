import { EMPTY, type Level, makeLevel, type State } from './level';
import { makeRng, randInt } from './random';

/** Testbild aus zufälligen Farbflächen (jedes Feld bekommt die Farbe des nächsten Keims). */
export function patchLevel(w: number, h: number, colors: number, seed: number): Level {
  const rng = makeRng(seed);
  const seeds = Array.from({ length: colors * 3 }, (_, k) => ({
    x: rng() * w,
    y: rng() * h,
    color: k % colors,
  }));
  const target = new Int16Array(w * h);
  for (let i = 0; i < target.length; i++) {
    const x = i % w;
    const y = Math.floor(i / w);
    let best = seeds[0];
    let bd = Number.POSITIVE_INFINITY;
    for (const s of seeds) {
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    target[i] = best.color;
  }
  const palette = Array.from({ length: colors }, (_, k) => `#${(k * 37 + 20).toString(16).padStart(2, '0')}8040`);
  return makeLevel(`Test ${w}x${h}`, w, h, palette, target);
}

/** Bild aus Zeilen wie "AAB" (Buchstaben = Farben ab A, Punkt = kein Feld). */
export function levelFromRows(rows: string[]): Level {
  const h = rows.length;
  const w = rows[0].length;
  const target = new Int16Array(w * h);
  let colors = 0;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = ch === '.' ? EMPTY : ch.charCodeAt(0) - 65;
      target[y * w + x] = c;
      colors = Math.max(colors, c + 1);
    });
  });
  const palette = Array.from({ length: colors }, (_, k) => `#${(k * 60 + 30).toString(16).padStart(2, '0')}6090`);
  return makeLevel('Handbild', w, h, palette, target);
}

/** Murmeln je Farbe auf Brett und Ablage zusammen. */
export function marbleCounts(level: Level, state: State): number[] {
  const n = new Array<number>(level.palette.length).fill(0);
  for (const i of level.cells) if (state.cur[i] !== EMPTY) n[state.cur[i]]++;
  for (const c of state.tray) if (c !== EMPTY) n[c]++;
  return n;
}

export function targetCounts(level: Level): number[] {
  const n = new Array<number>(level.palette.length).fill(0);
  for (const i of level.cells) n[level.target[i]]++;
  return n;
}

export function holeCount(level: Level, state: State): number {
  let n = 0;
  for (const i of level.cells) if (state.cur[i] === EMPTY) n++;
  return n;
}

export { makeRng, randInt };
