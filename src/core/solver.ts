import { components, isSolved } from './grid';
import { EMPTY, type Level, type State } from './level';
import { freeSlots, park, place, type Spot, selectCell, selectSlot } from './moves';

/**
 * Ein guter nächster Zug. Im Spiel wird nichts bewertet oder vorgeschlagen: Der Löser dient den automatischen Tests
 * und dem Vorführmodus. Er spielt über dieselben Funktionen wie ein Mensch (auswählen, dann Ziel antippen).
 */
export interface Suggestion {
  /** was anzutippen ist, um auszuwählen */
  readonly select: Spot;
  /** wohin: ein freies Loch oder die Ablage */
  readonly target: { readonly cell: number } | 'ablage';
  /** wie viele Murmeln der Zug bewegt */
  readonly count: number;
}

export interface SolverOptions {
  /** ab so vielen Murmeln gilt ein Zug als groß genug, um nicht erst zu parken */
  readonly bigMove: number;
  /** Anteil der freien Ablage, den ein Park-Zug höchstens belegt */
  readonly parkShare: number;
}

const DEFAULTS: SolverOptions = { bigMove: 4, parkShare: 0.8 };

/**
 * Wählt den direkten Zug, der die meisten Murmeln an ihren Platz bringt. Setzt der nur wenige,
 * wird lieber eine Gruppe geparkt, nach der ein viel größerer Zug möglich ist.
 */
export function suggest(level: Level, state: State, options: Partial<SolverOptions> = {}): Suggestion | null {
  const { bigMove, parkShare } = { ...DEFAULTS, ...options };
  const K = level.palette.length;
  const { groups, regions } = components(level, state.cur);

  const bigRegion: ((typeof regions)[number] | null)[] = new Array(K).fill(null);
  for (const r of regions) {
    const b = bigRegion[r.color];
    if (!b || r.cells.length > b.cells.length) bigRegion[r.color] = r;
  }

  let best: Suggestion | null = null;
  for (const g of groups) {
    const r = bigRegion[g.color];
    if (!r) continue;
    const count = Math.min(g.cells.length, r.cells.length);
    if (!best || count > best.count) best = { select: { cell: g.cells[0] }, target: { cell: r.cells[0] }, count };
  }
  const inTray = new Int32Array(K);
  const firstSlot = new Int32Array(K).fill(-1);
  state.tray.forEach((c, s) => {
    if (c === EMPTY) return;
    inTray[c]++;
    if (firstSlot[c] < 0) firstSlot[c] = s;
  });
  for (let c = 0; c < K; c++) {
    const r = bigRegion[c];
    if (!inTray[c] || !r) continue;
    const count = Math.min(inTray[c], r.cells.length);
    if (!best || count > best.count) best = { select: { slot: firstSlot[c] }, target: { cell: r.cells[0] }, count };
  }

  const room = freeSlots(state).length;
  if (room === 0 || groups.length === 0) return best;

  // Parken: die Gruppe, nach der der größte direkte Zug möglich wird, bei möglichst wenig belegter Ablage.
  const bigGroup = new Int32Array(K);
  for (const g of groups) bigGroup[g.color] = Math.max(bigGroup[g.color], g.cells.length);
  const perTarget = new Int32Array(K);
  let parkMove: (Suggestion & { follow: number }) | null = null;
  let parkScore = Number.NEGATIVE_INFINITY;
  for (const g of groups) {
    const count = Math.min(g.cells.length, room);
    perTarget.fill(0);
    for (const i of g.cells.slice(0, count)) perTarget[level.target[i]]++;
    let follow = 0;
    for (let t = 0; t < K; t++) if (perTarget[t]) follow = Math.max(follow, Math.min(perTarget[t], bigGroup[t]));
    const score = follow - count * 0.95 - (count > Math.max(1, room * parkShare) ? 100 : 0);
    if (score > parkScore) {
      parkScore = score;
      parkMove = { select: { cell: g.cells[0] }, target: 'ablage', count, follow };
    }
  }
  if (!best) return parkMove;
  if (parkMove && best.count < bigMove && parkMove.follow >= Math.max(bigMove, best.count * 3)) return parkMove;
  return best;
}

/** Führt einen Vorschlag über die normalen Spielfunktionen aus. Gibt zurück, wie viele Murmeln sich bewegt haben. */
export function play(level: Level, state: State, s: Suggestion): number {
  const sel = 'cell' in s.select ? selectCell(level, state, s.select.cell) : selectSlot(state, s.select.slot);
  if (!sel) throw new Error('Vorschlag wählt nichts aus');
  const result = s.target === 'ablage' ? park(level, state, sel) : place(level, state, sel, s.target.cell);
  if (!result.ok) throw new Error(`Vorschlag wurde abgelehnt: ${result.reason}`);
  return result.rolls.length;
}

/** Spielt das Bild zu Ende. Gibt die Zahl der Züge zurück. */
export function autoplay(level: Level, state: State, options: Partial<SolverOptions> = {}): number {
  const limit = level.cells.length * 4 + 10;
  let moves = 0;
  while (!isSolved(level, state.cur)) {
    const s = suggest(level, state, options);
    if (!s) throw new Error('Kein Zug mehr möglich, obwohl das Bild nicht fertig ist');
    play(level, state, s);
    if (++moves > limit) throw new Error('Löser kommt nicht zum Ende');
  }
  return moves;
}
