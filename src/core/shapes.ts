import { makeRng } from './random';
import type { Pt, Shape } from './scene';

/**
 * Bausteine für Motive. Alle Formen wirken wie mit der Schere aus Papier geschnitten: einfache Umrisse,
 * leicht unregelmäßig. Koordinaten im Einheitsquadrat (x nach rechts, y nach unten).
 */

export const poly = (...pts: Pt[]): Shape => ({ kind: 'poly', pts });

export const ellipse = (cx: number, cy: number, rx: number, ry: number = rx, rot = 0): Shape => ({
  kind: 'ellipse',
  cx,
  cy,
  rx,
  ry,
  rot,
});

export const rect = (x0: number, y0: number, x1: number, y1: number): Shape =>
  poly([x0, y0], [x1, y0], [x1, y1], [x0, y1]);

export interface RidgeOptions {
  /** mittlere Höhe der Kammlinie (0 = oben, 1 = unten) */
  readonly y: number;
  /** wie hoch die Wellen ausschlagen */
  readonly amp: number;
  /** Anzahl großer Wellen über die Bildbreite */
  readonly waves: number;
  readonly phase?: number;
  /** Anteil kleiner, schnellerer Wellen: 0 = sanfte Hügel, 1 = zackige Berge */
  readonly rough?: number;
  /** Neigung der ganzen Linie: positiv fällt nach rechts ab */
  readonly tilt?: number;
}

/** Hügel- oder Bergkette: alles unterhalb einer gewellten Linie bis zum unteren Bildrand. */
export function ridge({ y, amp, waves, phase = 0, rough = 0.3, tilt = 0 }: RidgeOptions): Shape {
  const pts: Pt[] = [];
  const steps = 48;
  for (let k = 0; k <= steps; k++) {
    const x = -0.02 + (1.04 * k) / steps;
    const a = x * waves * Math.PI * 2 + phase;
    const wave =
      Math.sin(a) * (1 - rough * 0.5) +
      Math.sin(a * 2.3 + phase * 1.7) * rough * 0.6 +
      Math.sin(a * 5.1) * rough * 0.25;
    pts.push([x, y + (x - 0.5) * tilt - wave * amp]);
  }
  pts.push([1.02, 1.02], [-0.02, 1.02]);
  return { kind: 'poly', pts };
}

/** Waagerechtes Band zwischen zwei Höhen, mit leicht gewellten Kanten (Wasserstreifen, Nebel, Wolkenbank). */
export function band(y0: number, y1: number, wave = 0.006, waves = 3, phase = 0): Shape {
  const pts: Pt[] = [];
  const steps = 24;
  for (let k = 0; k <= steps; k++) {
    const x = -0.02 + (1.04 * k) / steps;
    pts.push([x, y0 + Math.sin(x * waves * Math.PI * 2 + phase) * wave]);
  }
  for (let k = steps; k >= 0; k--) {
    const x = -0.02 + (1.04 * k) / steps;
    pts.push([x, y1 + Math.sin(x * waves * Math.PI * 2 + phase + 1.3) * wave]);
  }
  return { kind: 'poly', pts };
}

export interface BlobOptions {
  /** Unregelmäßigkeit des Umrisses, 0 = Kreis */
  readonly wobble?: number;
  /** Höhe relativ zur Breite */
  readonly squash?: number;
  readonly rot?: number;
  readonly seed?: number;
}

/** Rundliche, leicht unregelmäßige Form: Wolke, Laubkrone, Lichtfleck. */
export function blob(
  cx: number,
  cy: number,
  r: number,
  { wobble = 0.12, squash = 1, rot = 0, seed = 1 }: BlobOptions = {},
): Shape {
  const rng = makeRng(seed);
  const p1 = rng() * 6.28;
  const p2 = rng() * 6.28;
  const pts: Pt[] = [];
  const steps = 28;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2;
    const rad = r * (1 + wobble * Math.sin(a * 3 + p1) + wobble * 0.6 * Math.sin(a * 5 + p2));
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad * squash;
    pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  return { kind: 'poly', pts };
}

/** Seerosenblatt: Kreis mit keilförmiger Kerbe in Richtung `notch` (Bogenmaß). */
export function lilyPad(cx: number, cy: number, r: number, notch: number, gap = 0.45): Shape {
  const pts: Pt[] = [[cx, cy]];
  const steps = 26;
  for (let k = 0; k <= steps; k++) {
    const a = notch + gap / 2 + ((Math.PI * 2 - gap) * k) / steps;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return { kind: 'poly', pts };
}

/** Stamm: schmales Viereck von oben nach unten, auf Wunsch geneigt und nach oben verjüngt. */
export function trunk(x: number, width: number, lean = 0, top = -0.02, bottom = 1.02, taper = 0.8): Shape {
  const wt = (width * taper) / 2;
  const wb = width / 2;
  return poly([x + lean - wt, top], [x + lean + wt, top], [x + wb, bottom], [x - wb, bottom]);
}

/** Tanne als Silhouette: Dreieck auf kurzem Fuß. */
export function fir(x: number, base: number, height: number, width: number): Shape {
  return poly([x, base - height], [x + width / 2, base], [x - width / 2, base]);
}

/** Blüte: Stern aus spitzen Blättern. `inner` ist die Tiefe der Kerben: Ein kleiner Wert ergibt einen spitzen Stern. */
export function blossom(cx: number, cy: number, r: number, petals = 7, rot = 0, inner = 0.5): Shape {
  const pts: Pt[] = [];
  for (let k = 0; k < petals * 2; k++) {
    const a = rot + (k / (petals * 2)) * Math.PI * 2;
    const rad = k % 2 === 0 ? r : r * inner;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return { kind: 'poly', pts };
}

/** Blüte mit runden Blättern (Kirsche, Glockenblume): Die Blätter sind Bögen, dazwischen liegen Kerben. */
export function flower(cx: number, cy: number, r: number, petals = 5, rot = 0, notch = 0.5): Shape {
  const pts: Pt[] = [];
  const steps = petals * 10;
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2;
    const rad = r * (notch + (1 - notch) * Math.abs(Math.cos((a * petals) / 2)) ** 0.55);
    pts.push([cx + Math.cos(a + rot) * rad, cy + Math.sin(a + rot) * rad]);
  }
  return { kind: 'poly', pts };
}

/** Halbkreis um (cx, cy) als Punktfolge: beginnt beim Winkel `from` und läuft eine halbe Drehung weiter. */
function halfTurn(cx: number, cy: number, r: number, from: number, steps = 8): Pt[] {
  const pts: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const a = from + (Math.PI * k) / steps;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** Dicker Strich mit runden Enden von (x0, y0) nach (x1, y1): Mast, Stiel, Steg. */
export function capsule(x0: number, y0: number, x1: number, y1: number, width: number): Shape {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const r = width / 2;
  return { kind: 'poly', pts: [...halfTurn(x1, y1, r, a - Math.PI / 2), ...halfTurn(x0, y0, r, a + Math.PI / 2)] };
}

/**
 * Band entlang einer weichen Kurve durch die Punkte `spine`, mit eigener Breite an jedem Punkt: Zweig, Fischleib,
 * Walrücken. Wo die Breite an einem Ende größer als null ist, schließt das Band dort rund ab.
 */
export function ribbon(spine: readonly Pt[], widths: number | readonly number[], steps = 6): Shape {
  const n = spine.length;
  const clamp = (k: number): number => Math.max(0, Math.min(n - 1, k));
  const widthAt = (k: number): number => (typeof widths === 'number' ? widths : widths[clamp(k)]);
  // Catmull-Rom: Die Kurve läuft ohne Knick durch jeden Punkt.
  const blend = (a: number, b: number, c: number, d: number, t: number): number =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  const curve: { x: number; y: number; w: number }[] = [];
  for (let k = 0; k < n - 1; k++) {
    const [p0, p1, p2, p3] = [spine[clamp(k - 1)], spine[k], spine[k + 1], spine[clamp(k + 2)]];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      curve.push({
        x: blend(p0[0], p1[0], p2[0], p3[0], t),
        y: blend(p0[1], p1[1], p2[1], p3[1], t),
        w: Math.max(0, blend(widthAt(k - 1), widthAt(k), widthAt(k + 1), widthAt(k + 2), t)),
      });
    }
  }
  curve.push({ x: spine[n - 1][0], y: spine[n - 1][1], w: widthAt(n - 1) });
  const last = curve.length - 1;
  const heading = (k: number): number => {
    const a = curve[Math.max(0, k - 1)];
    const b = curve[Math.min(last, k + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  };
  const near: Pt[] = [];
  const far: Pt[] = [];
  curve.forEach(({ x, y, w }, k) => {
    const a = heading(k);
    const nx = (Math.sin(a) * w) / 2;
    const ny = (-Math.cos(a) * w) / 2;
    near.push([x + nx, y + ny]);
    far.push([x - nx, y - ny]);
  });
  // an der einen Kante hin, um das Ende herum, an der anderen zurück, um den Anfang herum
  const end =
    curve[last].w > 0 ? halfTurn(curve[last].x, curve[last].y, curve[last].w / 2, heading(last) - Math.PI / 2) : [];
  const start = curve[0].w > 0 ? halfTurn(curve[0].x, curve[0].y, curve[0].w / 2, heading(0) + Math.PI / 2) : [];
  return { kind: 'poly', pts: [...near, ...end, ...far.reverse(), ...start] };
}

/**
 * Spitzes Blatt aus zwei Bögen, `length` lang und in der Mitte `width` breit: Laub, Flosse, Schwanzflosse.
 * `bend` krümmt das Blatt zur Seite (Anteil der Länge).
 */
export function leaf(cx: number, cy: number, length: number, width: number, rot = 0, bend = 0): Shape {
  const pts: Pt[] = [];
  const steps = 12;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const push = (u: number, v: number) => pts.push([cx + u * cos - v * sin, cy + u * sin + v * cos]);
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    push((t - 0.5) * length, (bend * length - width / 2) * Math.sin(Math.PI * t));
  }
  for (let k = steps - 1; k >= 1; k--) {
    const t = k / steps;
    push((t - 0.5) * length, (bend * length + width / 2) * Math.sin(Math.PI * t));
  }
  return { kind: 'poly', pts };
}

/** Kuppel: obere Hälfte einer Ellipse über einer geraden Grundlinie auf Höhe `base`: Pilzhut, Felsbuckel, Zelt. */
export function dome(cx: number, base: number, rx: number, ry: number): Shape {
  const pts: Pt[] = [];
  const steps = 20;
  for (let k = 0; k <= steps; k++) {
    const a = Math.PI + (Math.PI * k) / steps;
    pts.push([cx + Math.cos(a) * rx, base + Math.sin(a) * ry]);
  }
  return { kind: 'poly', pts };
}

/**
 * Sichel: ein Halbkreis, aus dem eine halbe Ellipse herausgeschnitten ist. `phase` ist der beleuchtete Anteil
 * (0,5 = Halbmond, kleiner = schmale Sichel), `rot` dreht die runde Seite (0 = nach rechts).
 */
export function crescent(cx: number, cy: number, r: number, phase = 0.3, rot = 0): Shape {
  const pts: Pt[] = [];
  const steps = 18;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const inner = 1 - 2 * phase;
  const push = (u: number, v: number) => pts.push([cx + u * cos - v * sin, cy + u * sin + v * cos]);
  for (let k = 0; k <= steps; k++) {
    const a = -Math.PI / 2 + (Math.PI * k) / steps;
    push(Math.cos(a) * r, Math.sin(a) * r);
  }
  for (let k = steps - 1; k >= 1; k--) {
    const a = -Math.PI / 2 + (Math.PI * k) / steps;
    push(Math.cos(a) * r * inner, Math.sin(a) * r);
  }
  return { kind: 'poly', pts };
}

/** Wolke: unten gerade, oben mehrere Bögen. `w` und `h` sind Breite und Höhe, die Saat ordnet die Bögen. */
export function cloud(cx: number, cy: number, w: number, h: number, seed = 1): Shape {
  const rng = makeRng(seed);
  const base = cy + h / 2;
  const left = cx - w / 2;
  const count = Math.max(3, Math.round(w / (h * 0.9)));
  // Buckel als Halbkreise auf der Grundlinie: außen kleiner, zur Mitte hin höher, der höchste ist `h` hoch
  const raw: number[] = [];
  for (let k = 0; k < count; k++) raw.push(0.5 + 0.5 * Math.sin((Math.PI * (k + 0.5)) / count) * (0.7 + 0.3 * rng()));
  const peak = Math.max(...raw);
  const radii = raw.map((v) => (v / peak) * h);
  const span = w - radii[0] - radii[count - 1];
  const bumps = radii.map((r, k) => ({ x: left + radii[0] + (span * k) / (count - 1), r }));
  const pts: Pt[] = [];
  const steps = 48;
  for (let k = 0; k <= steps; k++) {
    const x = left + (w * k) / steps;
    let top = 0;
    for (const b of bumps) {
      const d = x - b.x;
      if (Math.abs(d) < b.r) top = Math.max(top, Math.sqrt(b.r * b.r - d * d));
    }
    pts.push([x, base - top]);
  }
  return { kind: 'poly', pts };
}

/**
 * Ringstück um (cx, cy) zwischen den Radien r - width / 2 und r + width / 2, von Winkel a0 bis a1 (Bogenmaß,
 * 0 = nach rechts, 90° = nach unten): Wellenring, Lichtkreis, Regenbogen.
 */
export function arc(cx: number, cy: number, r: number, width: number, a0 = 0, a1 = Math.PI * 2): Shape {
  const pts: Pt[] = [];
  const steps = Math.max(6, Math.round((Math.abs(a1 - a0) / (Math.PI * 2)) * 48));
  for (let k = 0; k <= steps; k++) {
    const a = a0 + ((a1 - a0) * k) / steps;
    pts.push([cx + Math.cos(a) * (r + width / 2), cy + Math.sin(a) * (r + width / 2)]);
  }
  for (let k = steps; k >= 0; k--) {
    const a = a0 + ((a1 - a0) * k) / steps;
    pts.push([cx + Math.cos(a) * (r - width / 2), cy + Math.sin(a) * (r - width / 2)]);
  }
  return { kind: 'poly', pts };
}

/**
 * Ballonhülle: oben eine Halbkugel mit Radius r um (cx, cy), darunter läuft sie über die Länge `tail` zum Hals
 * zusammen. `squeeze` staucht die Form in der Breite: Mit Werten unter 1 entstehen die Bahnen, aus denen die
 * Hülle genäht ist.
 */
export function balloon(cx: number, cy: number, r: number, tail: number, squeeze = 1, neck = 0.2): Shape {
  const half: Pt[] = [];
  const steps = 14;
  for (let k = 0; k <= steps; k++) {
    const a = -Math.PI / 2 + ((Math.PI / 2) * k) / steps;
    half.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let k = 1; k <= steps; k++) {
    const v = k / steps;
    half.push([r * (neck + (1 - neck) * Math.cos((Math.PI / 2) * v) ** 0.8), tail * v]);
  }
  const pts: Pt[] = half.map(([x, y]) => [cx + x * squeeze, cy + y]);
  for (let k = half.length - 1; k >= 0; k--) pts.push([cx - half[k][0] * squeeze, cy + half[k][1]]);
  return { kind: 'poly', pts };
}

/** Ein Arm des Säulenkaktus */
export interface CactusArm {
  /** -1 = links, 1 = rechts */
  readonly side: -1 | 1;
  /** Höhe des Ansatzes über dem Fuß */
  readonly at: number;
  /** Abstand der Armmitte von der Stammmitte */
  readonly reach: number;
  /** wie weit der Arm vom Ansatz nach oben steigt */
  readonly rise: number;
  readonly width: number;
}

/**
 * Säulenkaktus als ein einziger Umriss: Stamm mit runder Kuppe, dazu Arme, die erst zur Seite und dann nach oben
 * gehen. (x, base) ist die Mitte des Fußes.
 */
export function saguaro(
  x: number,
  base: number,
  height: number,
  width: number,
  arms: readonly CactusArm[] = [],
): Shape {
  const hw = width / 2;
  // eine Seite von unten nach oben an der Außenkante entlang, samt Armen
  const side = (s: -1 | 1): Pt[] => {
    const out: Pt[] = [[x + s * hw, base]];
    for (const arm of arms.filter((a) => a.side === s).sort((a, b) => a.at - b.at)) {
      const y = base - arm.at;
      const ax = x + s * arm.reach;
      const aw = arm.width / 2;
      out.push([x + s * hw, y + aw]);
      for (let k = 0; k <= 6; k++) {
        const t = ((Math.PI / 2) * k) / 6;
        out.push([ax + s * Math.sin(t) * aw, y + Math.cos(t) * aw]);
      }
      for (let k = 0; k <= 8; k++) {
        const t = (Math.PI * k) / 8;
        out.push([ax + s * Math.cos(t) * aw, y - arm.rise - Math.sin(t) * aw]);
      }
      out.push([ax - s * aw, y - aw], [x + s * hw, y - aw]);
    }
    out.push([x + s * hw, base - height + hw]);
    return out;
  };
  const pts: Pt[] = side(-1);
  for (let k = 1; k < 10; k++) {
    const a = Math.PI + (Math.PI * k) / 10;
    pts.push([x + Math.cos(a) * hw, base - height + hw + Math.sin(a) * hw]);
  }
  pts.push(...side(1).reverse());
  return { kind: 'poly', pts };
}
