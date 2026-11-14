import { deal } from './deal';
import { isSolved } from './grid';
import { cloneState, EMPTY, type Level, newState, type State } from './level';
import {
  hasFreeHole,
  park,
  place,
  type Refusal,
  type Roll,
  remainder,
  type Selection,
  selectCell,
  selectColor,
} from './moves';
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
      /** Was von der Auswahl nicht mitrollen konnte. Es bleibt gewählt. */
      readonly rest: Selection | null;
    }
  | { readonly type: 'abgelehnt'; readonly reason: Refusal | 'nichts-gewählt' }
  | { readonly type: 'liegt-richtig'; readonly cell: number }
  | { readonly type: 'nichts' };

const NOTHING: Outcome = { type: 'nichts' };

/**
 * Spielsteuerung. Ein Zug hat zwei Schritte: erst eine Gruppe wählen, dann ein Ziel antippen
 * (ein freies Loch derselben Farbe oder die Ablage). Murmeln auf der Ablage sind immer gewählt: Für sie
 * genügt der Tipp auf ein freies Loch ihrer Farbe. Passt die Gruppe nicht ganz ins Ziel, bleibt der Rest gewählt.
 * Es wird nichts gezählt und nichts bewertet.
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
      const selection = this.selection;
      if (selection && selection.color === level.target[cell]) {
        return this.roll('bild', selection, (s) => place(level, s, selection, cell));
      }
      // Das Holzbrett ist immer mit gewählt: Ein Tipp auf ein freies Loch holt die passende Farbe von dort.
      // Eine im Bild gewählte Gruppe anderer Farbe bleibt dabei gewählt.
      const fromTray = selectColor(state, level.target[cell]);
      if (fromTray) return this.roll('bild', fromTray, (s) => place(level, s, fromTray, cell), true);
      return { type: 'abgelehnt', reason: selection ? 'falsche-farbe' : 'nichts-gewählt' };
    }
    if (here === level.target[cell]) return { type: 'liegt-richtig', cell };
    if (this.selection?.source === 'board' && this.selection.cells.includes(cell)) return this.deselect();
    return this.select(selectCell(level, state, cell));
  }

  /**
   * Tipp auf die Ablage. `slot` ist die getroffene Mulde oder null für das Brett daneben.
   *
   * Die Murmeln auf dem Brett muss man nie eigens wählen: Sie gelten immer als gewählt, alle Farben zugleich
   * (siehe `tapCell`). Ist eine Gruppe aus dem Bild gewählt, legt ein Tipp auf eine freie Mulde, auf das Holz oder
   * auf eine Murmel derselben Farbe sie ab. Ein Tipp auf eine Murmel anderer Farbe hebt die Auswahl im Bild auf.
   */
  tapTray(slot: number | null): Outcome {
    const { level, state } = this;
    const selection = this.selection;
    if (!selection) return NOTHING;
    const here = slot === null ? EMPTY : (state.tray[slot] ?? EMPTY);
    if (here !== EMPTY && here !== selection.color) return this.deselect();
    return this.roll('ablage', selection, (s) => park(level, s, selection, this.trayAt ?? undefined));
  }

  /** Solange nichts im Bild gewählt ist, sind die Murmeln auf dem Brett am Zug. */
  get trayActive(): boolean {
    return this.selection === null && this.state.tray.some((c) => c !== EMPTY);
  }

  tapOutside(): Outcome {
    return this.selection ? this.deselect() : NOTHING;
  }

  /**
   * Ändert die Zahl der Mulden auf dem Holzbrett. Größer geht immer: Die Murmeln bleiben, wo sie liegen, neue
   * Mulden kommen hinten dazu. Kleiner geht nur, solange alle Murmeln noch Platz haben; sie rücken dann zusammen.
   * Danach lässt sich nichts mehr zurücknehmen, denn frühere Stände hatten eine andere Brettgröße.
   */
  resizeTray(size: number): boolean {
    const old = this.state.tray;
    if (size === old.length) return true;
    const marbles = Array.from(old).filter((c) => c !== EMPTY);
    if (size < 1 || marbles.length > size) return false;
    const tray = new Int16Array(size).fill(EMPTY);
    if (size > old.length) tray.set(old);
    else tray.set(marbles);
    this.state = { cur: this.state.cur, tray };
    this.history = [];
    return true;
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

  private roll(
    ziel: 'bild' | 'ablage',
    selection: Selection,
    move: (s: State) => ReturnType<typeof place>,
    keep = false,
  ): Outcome {
    const before = cloneState(this.state);
    const result = move(this.state);
    if (!result.ok) return { type: 'abgelehnt', reason: result.reason };
    this.history.push(before);
    if (this.history.length > 200) this.history.shift();
    // Was nicht mitrollen konnte, bleibt gewählt.
    // Kam der Zug vom Holzbrett, bleibt die Auswahl im Bild unberührt.
    const rest = keep ? null : remainder(selection, result.rolls);
    if (!keep) this.selection = rest;
    return { type: 'gerollt', ziel, color: result.color, rolls: result.rolls, fertig: this.solved, rest };
  }
}
