/** Seedbarer Zufall (mulberry32): gleiche Saat, gleiche Folge. Macht Motive und Tests wiederholbar. */
export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ganzzahl in [0, n) */
export const randInt = (rng: Rng, n: number): number => Math.floor(rng() * n);

/** Mischt das Array an Ort und Stelle (Fisher-Yates) und gibt es zurück. */
export function shuffle<T>(rng: Rng, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const t = items[i];
    items[i] = items[j];
    items[j] = t;
  }
  return items;
}
