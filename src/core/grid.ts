import { EMPTY, type Level } from './level';

/** Die bis zu vier Nachbarn eines Felds (oben, unten, links, rechts). */
export function neighbors(level: Level, i: number): number[] {
  const { w, target } = level;
  const x = i % w;
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < w - 1) out.push(i + 1);
  if (i >= w) out.push(i - w);
  if (i + w < target.length) out.push(i + w);
  return out;
}

/** Breitensuche ab `start` über alle Nachbarn, die `pred` erfüllen. Die Reihenfolge entspricht dem Abstand vom Start. */
export function flood(
  level: Level,
  start: number,
  pred: (i: number) => boolean,
  seen: Uint8Array = new Uint8Array(level.target.length),
): number[] {
  const out = [start];
  seen[start] = 1;
  for (let head = 0; head < out.length; head++) {
    for (const j of neighbors(level, out[head])) {
      if (!seen[j] && pred(j)) {
        seen[j] = 1;
        out.push(j);
      }
    }
  }
  return out;
}

/** Liegt hier eine Murmel, die noch nicht an ihrem Platz ist? */
export const isMisplaced = (level: Level, cur: Int16Array, i: number): boolean =>
  cur[i] !== EMPTY && cur[i] !== level.target[i];

/** Die Murmel auf Feld i samt aller angrenzenden Murmeln derselben Farbe, die auch noch falsch liegen. */
export function groupAt(level: Level, cur: Int16Array, i: number): number[] {
  const c = cur[i];
  return flood(level, i, (j) => cur[j] === c && level.target[j] !== c);
}

/** Das freie Loch i samt aller angrenzenden freien Löcher derselben Zielfarbe. */
export function regionAt(level: Level, cur: Int16Array, i: number): number[] {
  const t = level.target[i];
  return flood(level, i, (j) => cur[j] === EMPTY && level.target[j] === t);
}

export interface Cluster {
  readonly color: number;
  readonly cells: number[];
}

/** Alle Gruppen falsch liegender Murmeln und alle Bereiche freier Löcher. */
export function components(level: Level, cur: Int16Array): { groups: Cluster[]; regions: Cluster[] } {
  const seen = new Uint8Array(cur.length);
  const groups: Cluster[] = [];
  const regions: Cluster[] = [];
  for (const i of level.cells) {
    if (seen[i]) continue;
    const c = cur[i];
    const t = level.target[i];
    if (c === EMPTY) {
      regions.push({ color: t, cells: flood(level, i, (j) => cur[j] === EMPTY && level.target[j] === t, seen) });
    } else if (c !== t) {
      groups.push({ color: c, cells: flood(level, i, (j) => cur[j] === c && level.target[j] !== c, seen) });
    }
  }
  return { groups, regions };
}

/** Wie viele Felder zeigen noch nicht ihre Zielfarbe? */
export function remaining(level: Level, cur: Int16Array): number {
  let n = 0;
  for (const i of level.cells) if (cur[i] !== level.target[i]) n++;
  return n;
}

export const isSolved = (level: Level, cur: Int16Array): boolean => remaining(level, cur) === 0;

/** Liegt auf jedem Feld dieser Zielfarbe schon die richtige Murmel? */
export function colorDone(level: Level, cur: Int16Array, color: number): boolean {
  let any = false;
  for (const i of level.cells) {
    if (level.target[i] !== color) continue;
    if (cur[i] !== color) return false;
    any = true;
  }
  return any;
}
