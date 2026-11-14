/** Ein Bild als Raster: Jedes Feld hat eine Zielfarbe. Die Murmeln liegen anfangs falsch und sollen an ihren Platz. */
export interface Level {
  readonly name: string;
  readonly w: number;
  readonly h: number;
  /** Murmelfarben als Hex, der Index ist die Farbnummer. */
  readonly palette: readonly string[];
  /** Zielfarbe je Feld, -1 heißt: Dieses Feld gehört nicht zum Bild. */
  readonly target: Int16Array;
  /** Alle Felder, die zum Bild gehören. */
  readonly cells: readonly number[];
}

/** Spielstand: Was liegt wo. */
export interface State {
  /** Farbe der Murmel je Feld, -1 = leeres Loch. */
  cur: Int16Array;
  /** Farbe der Murmel je Mulde der Ablage, -1 = leere Mulde. Mulden sind feste Plätze. */
  tray: Int16Array;
}

export const EMPTY = -1;

export function makeLevel(name: string, w: number, h: number, palette: readonly string[], target: Int16Array): Level {
  if (target.length !== w * h) throw new Error(`Raster passt nicht: ${target.length} Felder statt ${w * h}`);
  const cells: number[] = [];
  for (let i = 0; i < target.length; i++) if (target[i] >= 0) cells.push(i);
  return { name, w, h, palette, target, cells };
}

export function newState(cur: Int16Array, traySize: number): State {
  return { cur, tray: new Int16Array(traySize).fill(EMPTY) };
}

export const cloneState = (s: State): State => ({ cur: s.cur.slice(), tray: s.tray.slice() });
