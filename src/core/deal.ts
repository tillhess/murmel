import { neighbors } from './grid';
import { EMPTY, type Level } from './level';
import { type Rng, randInt, shuffle } from './random';

/**
 * Startaufstellung. Die Murmeln liegen in einfarbigen Flecken, und jeder Fleck liegt ganz in einem Bildbereich
 * (z. B. ein blauer Fleck mitten im roten Feld), aber nie auf seiner eigenen Zielfarbe.
 *
 * Warum so: Wird ein Fleck bewegt, entsteht ein zusammenhängendes Loch in einer einzigen Farbe, das wieder eine
 * ganze Gruppe aufnehmen kann. So ergeben sich ruhige, große Züge statt Einzelmurmel-Gefummel.
 *
 * @param blob Fleckgröße relativ zur Wurzel der Murmelzahl
 */
export function deal(level: Level, rng: Rng, blob = 0.8): Int16Array {
  const { cells, target, palette } = level;
  const K = palette.length;
  // rem[c]: noch zu verteilende Murmeln der Farbe c, remT[c]: noch freie Felder mit Zielfarbe c
  const rem = new Int32Array(K);
  const remT = new Int32Array(K);
  for (const i of cells) {
    rem[target[i]]++;
    remT[target[i]]++;
  }
  let remCells = cells.length;
  const cur = new Int16Array(target.length).fill(EMPTY);
  const size = Math.max(4, Math.min(30, Math.round(Math.sqrt(cells.length) * blob)));

  // Farbe für ein Feld mit Zielfarbe t. Eine Farbe, die sonst nirgends mehr hinpasst, geht vor:
  // So bleibt bis zum Schluss eine Verteilung möglich, in der keine Murmel auf ihrer Zielfarbe liegt.
  const pick = (t: number, prefer: number): number => {
    for (let x = 0; x < K; x++) {
      if (x !== t && rem[x] > 0 && rem[x] >= remCells - remT[x]) return x;
    }
    if (prefer >= 0 && prefer !== t && rem[prefer] > 0) return prefer;
    let total = 0;
    for (let x = 0; x < K; x++) if (x !== t) total += rem[x];
    if (total <= 0) return t; // nur möglich, wenn eine Farbe mehr als die Hälfte des Bildes ausmacht
    let r = rng() * total;
    for (let x = 0; x < K; x++) {
      if (x === t) continue;
      r -= rem[x];
      if (r < 0) return x;
    }
    return t;
  };
  const assign = (i: number, c: number) => {
    cur[i] = c;
    rem[c]--;
    remT[target[i]]--;
    remCells--;
  };

  const order = shuffle(rng, cells.slice());
  let next = 0;
  const frontier: number[] = []; // freie Felder neben schon belegten: dort beginnt bevorzugt der nächste Fleck
  const takeRandom = (list: number[]): number => {
    const k = randInt(rng, list.length);
    const v = list[k];
    list[k] = list[list.length - 1];
    list.pop();
    return v;
  };

  while (remCells > 0) {
    let start = -1;
    while (frontier.length && start < 0) {
      const i = takeRandom(frontier);
      if (cur[i] === EMPTY) start = i;
    }
    if (start < 0) {
      while (cur[order[next]] !== EMPTY) next++;
      start = order[next];
    }
    const t = target[start];
    const want = Math.max(1, Math.round(size * (0.6 + rng() * 0.8)));
    let color = pick(t, -1);
    let placed = 0;
    const queue = [start];
    while (queue.length && placed < want) {
      const i = takeRandom(queue);
      if (cur[i] !== EMPTY) continue;
      const c = pick(t, color);
      if (c !== color && placed > 0) {
        frontier.push(i); // die Farbe muss wechseln: dieser Fleck endet hier
        break;
      }
      assign(i, c);
      color = c;
      placed++;
      for (const j of neighbors(level, i)) {
        if (target[j] >= 0 && cur[j] === EMPTY) (target[j] === t ? queue : frontier).push(j);
      }
    }
    for (const i of queue) if (cur[i] === EMPTY) frontier.push(i);
  }
  return cur;
}
