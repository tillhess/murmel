import { deal } from './deal';
import { isSolved } from './grid';
import { cloneState, EMPTY, type Level, newState, type State } from './level';
import { hasFreeHole, park, place, type Refusal, type Roll, type Selection, selectCell, selectSlot } from './moves';
import type { Rng } from './random';

/** Was ein Tipp bewirkt hat. Die Darstellung reagiert darauf mit Bewegung und Klang. */
export type Outcome =
  | { readonly type: 'gewählt'; readonly selection: Selection; readonly hatLoch: boolean }
  | { readonly type: 'abgewählt' }
  | {
      readonly type: 'gerollt';
      readonly ziel: 'bild' | 'ablage';
      readonly color: number;
      readonly rolls: readonly Roll[];
      readonly fertig: boolean;
    }
  | { readonly type: 'abgelehnt'; readonly reason: Refusal | 'nichts-gewählt' }
  | { readonly type: 'liegt-richtig'; readonly cell: number }
  | { readonly type: 'nichts' };

const NOTHING: Outcome = { type: 'nichts' };

/**
 * Spielsteuerung. Ein Zug hat zwei Schritte: erst eine Gruppe wählen, dann ein Ziel antippen
 * (ein freies Loch derselben Farbe oder die Ablage). Es wird nichts gezählt und nichts bewertet.
 */
export class Game {
  readonly level: Level;
  state: State;
  selection: Selection | null = null;
  /**
   * Wo die Ablage liegt, in Rasterkoordinaten (z. B. unter oder rechts neben dem Bild). Passen nicht alle
   * gewählten Murmeln hinein, rollen die los, die diesem Punkt am nächsten liegen.
   */
  trayAt: readonly [number, number] | null = null;
  private history: State[] = [];

  constructor(level: Level, start: State) {
    this.level = level;
    this.state = start;
  }

  /** Neues Spiel mit frischer Startaufstellung. */
  static start(level: Level, rng: Rng, traySize: number): Game {
    return new Game(level, newState(deal(level, rng), traySize));
  }

  get solved(): boolean {
    return isSolved(this.level, this.state.cur);
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  tapCell(cell: number): Outcome {
    const { level, state } = this;
    if (level.target[cell] === undefined || level.target[cell] < 0) return this.tapOutside();
    const here = state.cur[cell];
    if (here === EMPTY) {
      if (!this.selection) return { type: 'abgelehnt', reason: 'nichts-gewählt' };
      return this.roll('bild', (s) => place(level, s, this.selection as Selection, cell));
    }
    if (here === level.target[cell]) return { type: 'liegt-richtig', cell };
    if (this.selection?.source === 'board' && this.selection.cells.includes(cell)) return this.deselect();
    return this.select(selectCell(level, state, cell));
  }

  /** Tipp auf die Ablage. `slot` ist die getroffene Mulde oder null für das Brett daneben. */
  tapTray(slot: number | null): Outcome {
    const { level, state } = this;
    if (this.selection?.source === 'board') {
      return this.roll('ablage', (s) => park(level, s, this.selection as Selection, this.trayAt ?? undefined));
    }
    if (slot === null || state.tray[slot] === undefined || state.tray[slot] === EMPTY) return this.tapOutside();
    if (this.selection?.source === 'tray' && this.selection.color === state.tray[slot]) return this.deselect();
    return this.select(selectSlot(state, slot));
  }

  tapOutside(): Outcome {
    return this.selection ? this.deselect() : NOTHING;
  }

  undo(): boolean {
    const previous = this.history.pop();
    if (!previous) return false;
    this.state = previous;
    this.selection = null;
    return true;
  }

  private select(selection: Selection | null): Outcome {
    if (!selection) return NOTHING;
    this.selection = selection;
    return { type: 'gewählt', selection, hatLoch: hasFreeHole(this.level, this.state, selection.color) };
  }

  private deselect(): Outcome {
    this.selection = null;
    return { type: 'abgewählt' };
  }

  private roll(ziel: 'bild' | 'ablage', move: (s: State) => ReturnType<typeof place>): Outcome {
    const before = cloneState(this.state);
    const result = move(this.state);
    if (!result.ok) return { type: 'abgelehnt', reason: result.reason };
    this.history.push(before);
    if (this.history.length > 200) this.history.shift();
    this.selection = null;
    return { type: 'gerollt', ziel, color: result.color, rolls: result.rolls, fertig: this.solved };
  }
}
