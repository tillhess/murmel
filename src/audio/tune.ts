/**
 * Tonvorrat und Tonfolge, als reine Rechnung ohne Lautsprecher. Alle Klänge eines Bildes stammen aus derselben
 * Fünftonleiter über dem Grundton des Bildes: So passt jeder Ton zu jedem anderen, egal in welcher Reihenfolge
 * die Murmeln ankommen.
 */

/** Dur-Pentatonik in Halbtonschritten über dem Grundton */
export const SCALE = [0, 2, 4, 7, 9] as const;
/** Die Murmeln klingen über zwei Oktaven: hoch genug, um hell zu sein, tief genug, um nicht zu stechen. */
export const STEPS = SCALE.length * 2;

export const midiToHz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** MIDI-Note der Leiterstufe `step` über dem Grundton (Stufe 0 ist der Grundton, Stufe 5 seine Oktave). */
export function noteAt(root: number, step: number): number {
  const n = SCALE.length;
  return root + SCALE[((step % n) + n) % n] + 12 * Math.floor(step / n);
}

/** Wo eine Kette zu klingen beginnt: Jede Farbe hat ihre eigene Lage. */
export const startStep = (color: number): number => (color * 2) % 6;

export interface Walk {
  step: number;
  dir: 1 | -1;
}

/**
 * Der nächste Ton einer Kette: meist eine oder zwei Stufen weiter, manchmal eine zurück. An den Rändern des
 * Tonvorrats kehrt die Linie um. `rand` ist eine Zufallszahl zwischen 0 und 1.
 */
export function nextStep({ step, dir }: Walk, rand: number): Walk {
  const move = rand < 0.5 ? 1 : rand < 0.8 ? 2 : -1;
  const next = step + move * dir;
  if (next > STEPS - 1) return { step: 2 * (STEPS - 1) - next, dir: -1 };
  if (next < 0) return { step: -next, dir: 1 };
  return { step: next, dir };
}

/**
 * Der Schlusston einer Kette: die nächstgelegene Ruhestufe, also Grundton oder Quinte.
 * `avoid` ist der Ton davor: Der Schluss soll ihn nicht bloß wiederholen.
 */
export function restStep(step: number, avoid = -1): number {
  let best = -1;
  for (let s = 0; s <= STEPS; s++) {
    const degree = s % SCALE.length;
    if ((degree !== 0 && degree !== 3) || s === avoid) continue;
    if (best < 0 || Math.abs(s - step) < Math.abs(best - step)) best = s;
  }
  return best;
}

/**
 * Fächert Töne auf, die fast gleichzeitig fällig werden. Rollt eine Kette in einen schmalen Gang, kommen alle
 * Murmeln im selben Augenblick zur Ruhe: Ohne Auffächern wäre das ein Klangklumpen, mit ihm eine kleine Tonfolge.
 * Was zu spät käme, entfällt, damit der Klang dem Bild nicht hinterherläuft.
 */
export class Spread {
  private free = 0;

  constructor(
    /** kleinster Abstand zweier Töne in Sekunden */
    private readonly step: number,
    /** so viel später als sein Anlass darf ein Ton höchstens erklingen */
    private readonly maxLag: number,
  ) {}

  /**
   * Wann der Ton erklingen darf (in Sekunden der Tonuhr), oder null, wenn er entfällt.
   * Ein wichtiger Ton (`keep`, etwa der Schlusston einer Kette) darf länger auf seinen Platz warten.
   */
  at(now: number, keep = false): number | null {
    const t = Math.max(now, this.free);
    if (t - now > (keep ? this.maxLag * 2.5 : this.maxLag)) return null;
    this.free = t + this.step;
    return t;
  }
}
