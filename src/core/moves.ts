import { around, groupAt, isMisplaced, neighbors, regionAt } from './grid';
import { EMPTY, type Level, type State } from './level';

/** Ein Platz für eine Murmel: ein Feld auf dem Brett oder eine Mulde der Ablage. */
export type Spot = { readonly cell: number } | { readonly slot: number };

/** Der Weg einer einzelnen Murmel. `via` führt vom Einstieg (dem angetippten Loch bzw. der ersten Mulde) bis zum Ziel. */
export interface Roll {
  readonly travelColor?: number;
  readonly color: number;
  readonly from: Spot;
  readonly to: Spot;
  readonly via: readonly Spot[];
}

/** Was gerade ausgewählt ist: eine Gruppe auf dem Brett oder alle Murmeln einer Farbe in der Ablage. */
export type Selection =
  | { readonly source: 'board'; readonly color: number; readonly cells: readonly number[] }
  | { readonly source: 'tray'; readonly color: number; readonly slots: readonly number[] };

export type Refusal = 'kein-loch' | 'falsche-farbe' | 'ablage-voll' | 'liegt-schon-in-ablage';

/**
 * Ergebnis eines Zugs. `rolls` steht in Kettenreihenfolge: Die erste Murmel rollt voran und am weitesten,
 * die letzte bleibt im Einstieg liegen.
 */
export type MoveResult =
  | { readonly ok: true; readonly color: number; readonly rolls: readonly Roll[] }
  | { readonly ok: false; readonly reason: Refusal };

export const selectionSize = (sel: Selection): number => (sel.source === 'board' ? sel.cells.length : sel.slots.length);

/**
 * Was von einer Auswahl übrig ist, nachdem die Murmeln aus `rolls` losgerollt sind. Dieser Rest bleibt gewählt:
 * Passt eine Gruppe nicht ganz in ihr Ziel, kann man gleich das nächste Ziel antippen.
 */
export function remainder(sel: Selection, rolls: readonly Roll[]): Selection | null {
  if (sel.source === 'board') {
    const gone = new Set(rolls.map((r) => ('cell' in r.from ? r.from.cell : -1)));
    const cells = sel.cells.filter((c) => !gone.has(c));
    return cells.length ? { source: 'board', color: sel.color, cells } : null;
  }
  const gone = new Set(rolls.map((r) => ('slot' in r.from ? r.from.slot : -1)));
  const slots = sel.slots.filter((s) => !gone.has(s));
  return slots.length ? { source: 'tray', color: sel.color, slots } : null;
}

/** Tippt man eine falsch liegende Murmel an, ist sie samt allen angrenzenden Murmeln derselben Farbe gewählt. */
export function selectCell(level: Level, state: State, cell: number): Selection | null {
  if (!isMisplaced(level, state.cur, cell)) return null;
  return { source: 'board', color: state.cur[cell], cells: groupAt(level, state.cur, cell) };
}

/** Alle Murmeln einer Farbe in der Ablage, oder null, wenn dort keine liegt. */
export function selectColor(state: State, color: number): Selection | null {
  const slots: number[] = [];
  for (let s = 0; s < state.tray.length; s++) if (state.tray[s] === color) slots.push(s);
  return slots.length ? { source: 'tray', color, slots } : null;
}

/** Alle Murmeln in der Ablage, die dieselbe Farbe haben wie die in Mulde `slot`. */
export function selectSlot(state: State, slot: number): Selection | null {
  const color = state.tray[slot];
  if (color === undefined || color === EMPTY) return null;
  return selectColor(state, color);
}

export function freeSlots(state: State): number[] {
  const out: number[] = [];
  for (let s = 0; s < state.tray.length; s++) if (state.tray[s] === EMPTY) out.push(s);
  return out;
}

export function trayCount(state: State): number {
  let n = 0;
  for (const c of state.tray) if (c !== EMPTY) n++;
  return n;
}

/** Gibt es irgendwo ein freies Loch, in das diese Farbe gehört? */
export function hasFreeHole(level: Level, state: State, color: number): boolean {
  for (const i of level.cells) if (state.cur[i] === EMPTY && level.target[i] === color) return true;
  return false;
}

/** Die n Felder aus `cells`, die dem Punkt (x, y) im Raster am nächsten liegen, nächstes zuerst. */
function nearest(level: Level, cells: readonly number[], x: number, y: number, n: number): number[] {
  const d = (i: number) => ((i % level.w) - x) ** 2 + (Math.floor(i / level.w) - y) ** 2;
  return cells
    .map((cell, order) => ({ cell, order, dist: d(cell) }))
    .sort((a, b) => a.dist - b.dist || a.order - b.order)
    .slice(0, n)
    .map((e) => e.cell);
}

/**
 * Die Auswahl rollt in den Bereich freier Löcher rund um `hole`. Gefüllt wird nur dieser zusammenhängende Bereich
 * (zusammenhängend auch über Eck): Passen nicht alle hinein, bleiben die übrigen Murmeln liegen. Es rollen die
 * Murmeln, die dem Loch am nächsten sind.
 */
export function place(level: Level, state: State, sel: Selection, hole: number): MoveResult {
  if (level.target[hole] === undefined || level.target[hole] < 0 || state.cur[hole] !== EMPTY) {
    return { ok: false, reason: 'kein-loch' };
  }
  if (level.target[hole] !== sel.color) return { ok: false, reason: 'falsche-farbe' };

  const region = regionAt(level, state.cur, hole); // Reihenfolge: Abstand vom angetippten Loch
  const n = Math.min(selectionSize(sel), region.length);
  const dests = region.slice(0, n);

  // Wege im Zielbereich: Baum der Breitensuche ab dem Einstieg. So rollt jede Murmel nur über Löcher dieses Bereichs.
  // Unter gleich kurzen Wegen gewinnt der, der geradeaus führt; über Eck rollt eine Murmel nur, wo es sein muss.
  const index = new Map<number, number>();
  dests.forEach((cell, k) => {
    index.set(cell, k);
  });
  const parent = new Int32Array(n).fill(-1);
  const depth = new Int32Array(n);
  for (let k = 1; k < n; k++) {
    const straight = new Set(neighbors(level, dests[k]));
    let best = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const j of around(level, dests[k])) {
      const q = index.get(j);
      if (q === undefined || q >= k) continue;
      const score = depth[q] * 2 + (straight.has(j) ? 0 : 1);
      if (score < bestScore) {
        bestScore = score;
        best = q;
      }
    }
    parent[k] = best;
    depth[k] = depth[best] + 1;
  }
  const pathTo = (k: number): Spot[] => {
    const cells: number[] = [];
    for (let q = k; q >= 0; q = parent[q]) {
      cells.push(dests[q]);
      if (q === 0) break;
    }
    return cells.reverse().map((cell) => ({ cell }));
  };

  let from: Spot[];
  if (sel.source === 'board') {
    const cells = nearest(level, sel.cells, hole % level.w, Math.floor(hole / level.w), n);
    for (const c of cells) state.cur[c] = EMPTY;
    from = cells.map((cell) => ({ cell }));
  } else {
    const slots = sel.slots.slice(0, n);
    for (const s of slots) state.tray[s] = EMPTY;
    from = slots.map((slot) => ({ slot }));
  }
  for (const d of dests) state.cur[d] = sel.color;

  // Die vorderste Murmel rollt ins hinterste Loch, die letzte bleibt im Einstieg.
  const rolls = from.map((f, k): Roll => {
    const q = n - 1 - k;
    return { color: sel.color, from: f, to: { cell: dests[q] }, via: pathTo(q) };
  });
  return { ok: true, color: sel.color, rolls };
}

/**
 * Die Auswahl rollt in die Ablage. Dabei ordnet sich das Brett nach Farben: Gleiche Farben liegen immer
 * beieinander, lückenlos von vorn. Die neuen Murmeln kommen zu ihrer Farbe; gibt es die noch nicht, ans Ende.
 * Murmeln, die schon lagen, rücken dafür still zusammen. Ist nicht für alle Platz, rollen die Murmeln, die der
 * Ablage am nächsten liegen; der Rest bleibt. `toward` ist die Lage der Ablage in Rasterkoordinaten
 * (ohne Angabe: unter dem Bild).
 */
export function park(
  level: Level,
  state: State,
  sel: Selection,
  toward: readonly [number, number] = [(level.w - 1) / 2, level.h + 1],
): MoveResult {
  if (sel.source === 'tray') return { ok: false, reason: 'liegt-schon-in-ablage' };
  const n = Math.min(sel.cells.length, freeSlots(state).length);
  if (n === 0) return { ok: false, reason: 'ablage-voll' };

  // Farben in der Reihenfolge, in der sie bisher auf dem Brett liegen; die neue Farbe notfalls hinten an
  const order: number[] = [];
  const count = new Map<number, number>();
  for (const c of state.tray) {
    if (c === EMPTY) continue;
    if (!count.has(c)) order.push(c);
    count.set(c, (count.get(c) ?? 0) + 1);
  }
  if (!count.has(sel.color)) order.push(sel.color);
  const before = count.get(sel.color) ?? 0;
  count.set(sel.color, before + n);

  state.tray.fill(EMPTY);
  const slots: number[] = [];
  let at = 0;
  for (const c of order) {
    const k = count.get(c) ?? 0;
    for (let j = 0; j < k; j++) {
      state.tray[at] = c;
      // die letzten n Plätze dieser Farbe sind die neuen
      if (c === sel.color && j >= before) slots.push(at);
      at++;
    }
  }

  const cells = nearest(level, sel.cells, toward[0], toward[1], n);
  for (const c of cells) state.cur[c] = EMPTY;

  const rolls = cells.map((cell, k): Roll => {
    const q = n - 1 - k;
    return {
      color: sel.color,
      from: { cell },
      to: { slot: slots[q] },
      via: slots.slice(0, q + 1).map((slot) => ({ slot })),
    };
  });
  return { ok: true, color: sel.color, rolls };
}
