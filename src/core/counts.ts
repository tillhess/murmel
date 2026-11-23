import type { Level } from './level';

/** Freie oder falsch belegte Ziele zählen auch die Murmeln auf dem Holzbrett mit.
 * Schon verbuchte Ankünfte bleiben offen, bis die sichtbare Murmel angekommen ist. */
export function openCounts(level: Level, cur: Int16Array, arriving: ReadonlySet<number> = new Set()): number[] {
  const counts = level.palette.map(() => 0);
  for (const cell of level.cells) {
    const color = level.target[cell];
    if (cur[cell] !== color || arriving.has(cell)) counts[color]++;
  }
  return counts;
}
