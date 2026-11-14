/**
 * Zeitplan für eine rollende Kette. Alle Murmeln eines Zugs laufen über denselben Einstiegspunkt und folgen einander
 * dort in festem Abstand, wie Perlen auf einer Schnur. Reine Rechnung, die Darstellung fragt nur noch Positionen ab.
 */
export type Pt = readonly [number, number];

export interface Run {
  /** Wegpunkte: Start, Einstieg, dann der Weg bis zum Ziel */
  readonly pts: readonly Pt[];
  /** aufsummierte Weglänge bis zu jedem Wegpunkt */
  readonly cum: readonly number[];
  readonly length: number;
  /** Abrollzeit in Millisekunden nach Beginn des Zugs; bis dahin wartet die Murmel an ihrem Platz */
  readonly start: number;
  /** Strecke vor dem Ziel, auf der die Murmel ausrollt (Pixel) */
  readonly ease: number;
}

export interface ChainOptions {
  /** Rollgeschwindigkeit in Pixeln pro Millisekunde */
  readonly speed: number;
  /** Abstand zweier aufeinanderfolgender Murmeln in Pixeln */
  readonly spacing: number;
  /** Strecke vor dem Ziel, auf der eine Murmel ausrollt (Pixel). Ohne Angabe hält sie aus vollem Lauf. */
  readonly ease?: number;
}

/** Mit diesem Bruchteil ihres Tempos rollt eine Murmel in ihr Ziel. */
const ARRIVE = 0.4;

const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * @param paths je Murmel der Weg [Start, Einstieg, ...Weg im Ziel], in Kettenreihenfolge (vorderste zuerst)
 */
export function scheduleChain(paths: readonly (readonly Pt[])[], { speed, spacing, ease = 0 }: ChainOptions): Run[] {
  const gap = spacing / speed;
  const toEntry = paths.map((p) => (p.length > 1 ? dist(p[0], p[1]) : 0));
  // So früh wie möglich, aber so, dass die k-te Murmel den Einstieg genau k Abstände nach der ersten erreicht.
  let lead = 0;
  toEntry.forEach((d, k) => {
    lead = Math.max(lead, d / speed - k * gap);
  });
  return paths.map((raw, k) => {
    const pts: Pt[] = [raw[0]];
    for (const p of raw.slice(1)) if (dist(p, pts[pts.length - 1]) > 0.5) pts.push(p);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i], pts[i - 1]));
    return { pts, cum, length: cum[cum.length - 1], start: lead + k * gap - toEntry[k] / speed, ease };
  });
}

/** Die Ausrollstrecke dieser Murmel: höchstens ihr ganzer Weg. */
const easeOf = (run: Run): number => Math.max(0, Math.min(run.ease, run.length));

/** So lange rollt eine Murmel vom Abrollen bis ins Ziel (Millisekunden). Das Ausrollen kostet etwas Zeit. */
export function runDuration(run: Run, speed: number): number {
  const e = easeOf(run);
  return (run.length - e) / speed + e / ((speed * (1 + ARRIVE)) / 2);
}

/** Zurückgelegter Weg nach `u` Millisekunden Rollen: erst gleichmäßig, auf dem letzten Stück gleichmäßig langsamer. */
function rolledAfter(run: Run, u: number, speed: number): number {
  if (u <= 0) return 0;
  const e = easeOf(run);
  const cruise = (run.length - e) / speed;
  if (u <= cruise) return u * speed;
  if (e <= 0) return run.length;
  const brake = e / ((speed * (1 + ARRIVE)) / 2);
  const tau = Math.min(brake, u - cruise);
  return run.length - e + speed * tau - (speed * (1 - ARRIVE) * tau * tau) / (2 * brake);
}

/** Wo ist die Murmel zur Zeit t (ms nach Beginn des Zugs)? `rolled` ist der zurückgelegte Weg. */
export function runPosition(
  run: Run,
  t: number,
  speed: number,
): { x: number; y: number; rolled: number; done: boolean } {
  const rolled = Math.max(0, Math.min(run.length, rolledAfter(run, t - run.start, speed)));
  let i = 1;
  while (i < run.cum.length - 1 && run.cum[i] < rolled) i++;
  const a = run.pts[i - 1];
  const b = run.pts[i] ?? a;
  const seg = run.cum[i] - run.cum[i - 1] || 1;
  const f = Math.max(0, Math.min(1, (rolled - run.cum[i - 1]) / seg));
  return {
    x: a[0] + (b[0] - a[0]) * f,
    y: a[1] + (b[1] - a[1]) * f,
    rolled,
    done: t - run.start >= runDuration(run, speed),
  };
}

/** Wann ist die letzte Murmel der Kette angekommen? */
export function chainDuration(runs: readonly Run[], speed: number): number {
  return runs.reduce((end, r) => Math.max(end, r.start + runDuration(r, speed)), 0);
}
