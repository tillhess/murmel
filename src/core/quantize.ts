import { deltaE, luminance, rgbToHex, toLab } from './color';
import { type Level, makeLevel } from './level';

/**
 * Fester Satz Murmelfarben für eigene Fotos. Je zwei Farben liegen mindestens etwa 32 ΔE auseinander,
 * damit sie auch als kleine Glasmurmeln sicher zu unterscheiden sind.
 */
export const MARBLE_COLORS: Readonly<Record<string, string>> = {
  weiss: '#f7f4ec',
  beige: '#e2bd84',
  grau: '#8b919a',
  schwarz: '#17171b',
  rot: '#d8263a',
  dunkelrot: '#7a1a2a',
  orange: '#f5871f',
  gelb: '#f9d423',
  hellgruen: '#93d13a',
  gruen: '#2c8a45',
  tuerkis: '#18b3a6',
  hellblau: '#62b8f2',
  blau: '#1f5ad8',
  dunkelblau: '#1e2766',
  lila: '#9a2fb5',
  pink: '#ef67aa',
  braun: '#8b5527',
};

type P3 = [number, number, number];
const dist2 = (a: P3, b: P3) => (a[0] - b[0]) ** 2 * 2 + (a[1] - b[1]) ** 2 * 4 + (a[2] - b[2]) ** 2 * 3;
const lum3 = (p: P3) => p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11;

export interface Quantized {
  /** Farben des Bildes, von dunkel nach hell */
  readonly palette: string[];
  /** Farbnummer je Bildpunkt, -1 für durchsichtige Punkte */
  readonly index: Int16Array;
}

/**
 * Reduziert ein RGBA-Bild auf etwa k Farben (k-Means). Zwei Nachbesserungen für das Spiel:
 * Farben mit sehr wenigen Punkten werden der nächstliegenden zugeschlagen, und eine sehr große Farbfläche
 * (z. B. ein Himmel in einem Ton) wird in hell und dunkel geteilt, damit keine Farbe über die Hälfte belegt.
 */
export function quantize(data: ArrayLike<number>, pixels: number, k: number): Quantized | null {
  const pts: P3[] = [];
  const pointOf = new Int32Array(pixels).fill(-1);
  for (let i = 0; i < pixels; i++) {
    if (data[i * 4 + 3] > 128) {
      pointOf[i] = pts.length;
      pts.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    }
  }
  if (pts.length === 0) return null;

  // Startfarben: jeweils der Punkt, der von allen bisherigen am weitesten entfernt ist. Das hält kleine Akzentfarben.
  let centers: P3[] = [[...pts[Math.floor(pts.length / 2)]] as P3];
  const nearestDist = pts.map((p) => dist2(p, centers[0]));
  while (centers.length < Math.min(k, pts.length)) {
    let far = 0;
    for (let i = 1; i < pts.length; i++) if (nearestDist[i] > nearestDist[far]) far = i;
    if (nearestDist[far] === 0) break; // weniger verschiedene Farben als gewünscht
    centers.push([...pts[far]] as P3);
    for (let i = 0; i < pts.length; i++)
      nearestDist[i] = Math.min(nearestDist[i], dist2(pts[i], centers[centers.length - 1]));
  }

  const assign = new Int16Array(pts.length);
  const nearestCenter = (p: P3, skip = -1, alive?: number[]): number => {
    let best = -1;
    let bd = Number.POSITIVE_INFINITY;
    for (let j = 0; j < centers.length; j++) {
      if (j === skip || (alive && !alive[j])) continue;
      const d = dist2(p, centers[j]);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    return best;
  };
  const counts = (): number[] => {
    const n = new Array<number>(centers.length).fill(0);
    for (const j of assign) n[j]++;
    return n;
  };

  for (let round = 0; round < 12; round++) {
    const sum = centers.map(() => [0, 0, 0, 0]);
    pts.forEach((p, i) => {
      const j = nearestCenter(p);
      assign[i] = j;
      const s = sum[j];
      s[0] += p[0];
      s[1] += p[1];
      s[2] += p[2];
      s[3]++;
    });
    centers = centers.map((c, j) =>
      sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c,
    );
  }

  // sehr kleine Farben der nächstliegenden zuschlagen
  const minCount = Math.max(4, Math.round(pts.length * 0.006));
  for (;;) {
    const n = counts();
    let small = -1;
    n.forEach((m, j) => {
      if (m > 0 && m < minCount && (small < 0 || m < n[small])) small = j;
    });
    if (small < 0 || n.filter((m) => m > 0).length <= 2) break;
    pts.forEach((p, i) => {
      if (assign[i] === small) assign[i] = nearestCenter(p, small, n);
    });
  }

  // sehr große Farbflächen in hell und dunkel teilen
  for (let guard = 0; guard < 3; guard++) {
    const n = counts();
    let big = 0;
    n.forEach((m, j) => {
      if (m > n[big]) big = j;
    });
    if (n[big] <= pts.length * 0.38) break;
    const members: number[] = [];
    pts.forEach((_, i) => {
      if (assign[i] === big) members.push(i);
    });
    let lo = members[0];
    let hi = members[0];
    for (const i of members) {
      if (lum3(pts[i]) < lum3(pts[lo])) lo = i;
      if (lum3(pts[i]) > lum3(pts[hi])) hi = i;
    }
    if (dist2(pts[lo], pts[hi]) === 0) break; // einfarbige Fläche lässt sich nicht teilen
    let a: P3 = [...pts[lo]] as P3;
    let b: P3 = [...pts[hi]] as P3;
    for (let round = 0; round < 8; round++) {
      const sa = [0, 0, 0, 0];
      const sb = [0, 0, 0, 0];
      for (const i of members) {
        const p = pts[i];
        const s = dist2(p, a) <= dist2(p, b) ? sa : sb;
        s[0] += p[0];
        s[1] += p[1];
        s[2] += p[2];
        s[3]++;
      }
      if (sa[3]) a = [sa[0] / sa[3], sa[1] / sa[3], sa[2] / sa[3]];
      if (sb[3]) b = [sb[0] / sb[3], sb[1] / sb[3], sb[2] / sb[3]];
    }
    centers[big] = a;
    centers.push(b);
    for (const i of members) if (dist2(pts[i], b) < dist2(pts[i], a)) assign[i] = centers.length - 1;
  }

  const used = [...new Set(assign)];
  const hexes = used.map((j) => rgbToHex(centers[j][0], centers[j][1], centers[j][2]));
  const order = used.map((_, i) => i).sort((x, y) => luminance(hexes[x]) - luminance(hexes[y]));
  const renumber = new Map<number, number>();
  order.forEach((oi, ni) => {
    renumber.set(used[oi], ni);
  });
  const index = new Int16Array(pixels).fill(-1);
  for (let i = 0; i < pixels; i++) if (pointOf[i] >= 0) index[i] = renumber.get(assign[pointOf[i]]) as number;
  return { palette: order.map((oi) => hexes[oi]), index };
}

/** Wie stark sich die Murmelfarben eines eigenen Fotos voneinander abheben sollen */
export const PHOTO_CONTRASTS = ['naturnah', 'deutlich', 'kraeftig'] as const;
export type PhotoContrast = (typeof PHOTO_CONTRASTS)[number];
/**
 * Mindestabstand (ΔE) zwischen zwei Murmelfarben eines Fotos. Bei 0 zählt nur die Nähe zum Foto; der feste Satz
 * hält dann von sich aus etwa 32. Dunkle Töne (Schwarz, Dunkelblau, Dunkelrot, Braun) liegen als Glasmurmeln
 * enger beieinander, als die Zahl sagt: Ab 44 kommen sie nicht mehr nebeneinander vor.
 */
export const CONTRAST_SPREAD: Readonly<Record<PhotoContrast, number>> = { naturnah: 0, deutlich: 44, kraeftig: 56 };

/**
 * Ordnet jeder Bildfarbe eine eigene Murmelfarbe zu: die häufigste Farbe zuerst, jeweils die ähnlichste noch freie.
 * Eine bunte Bildfarbe wird dabei nicht zu Grau oder Schwarz entsättigt.
 * Mit `spread` kommen nur Murmelfarben in Frage, die von allen schon vergebenen mindestens so weit entfernt sind.
 * Gibt es keine solche mehr, gewinnt die, die sich am deutlichsten von den vergebenen abhebt.
 */
export function toMarbleColors(palette: readonly string[], counts: readonly number[], spread = 0): string[] {
  const pool = Object.values(MARBLE_COLORS);
  const order = palette.map((_, i) => i).sort((a, b) => counts[b] - counts[a]);
  const used = new Set<string>();
  const out: string[] = [];
  for (const i of order) {
    const A = toLab(palette[i]);
    const chromaA = Math.hypot(A[1], A[2]);
    let best = pool[0];
    let bd = Number.POSITIVE_INFINITY;
    let bestGap = -1;
    for (const candidate of pool) {
      if (used.has(candidate)) continue;
      const B = toLab(candidate);
      const d = deltaE(palette[i], candidate) + Math.max(0, chromaA - Math.hypot(B[1], B[2])) * 0.8;
      let gap = Number.POSITIVE_INFINITY;
      for (const taken of used) gap = Math.min(gap, deltaE(candidate, taken));
      // weit genug entfernte Farben sind untereinander gleich gut, darunter zählt jeder Schritt Abstand
      gap = Math.min(gap, spread);
      if (gap > bestGap || (gap === bestGap && d < bd)) {
        bestGap = gap;
        bd = d;
        best = candidate;
      }
    }
    used.add(best);
    out[i] = best;
  }
  return out;
}

/** Ein Foto als Raster: die Farben des Fotos (von dunkel nach hell) und je Feld die Nummer seiner Farbe. */
export interface PhotoRaster {
  readonly source: string[];
  readonly target: Int16Array;
}

/** Reduziert ein verkleinertes Foto (w × h Bildpunkte, RGBA) auf höchstens etwa k Farben. */
export function photoRaster(data: ArrayLike<number>, w: number, h: number, k: number): PhotoRaster | null {
  const q = quantize(data, w * h, Math.min(k, Object.keys(MARBLE_COLORS).length - 3));
  return q ? { source: q.palette, target: q.index } : null;
}

/** Mittlere Farbe des Fotos je Farbnummer eines Rasters. So lassen sich die Fotofarben zu einem alten Raster wiederfinden. */
export function sourceColors(data: ArrayLike<number>, target: ArrayLike<number>, colors: number): string[] {
  const sum = Array.from({ length: colors }, () => [0, 0, 0, 0]);
  for (let i = 0; i < target.length; i++) {
    const s = sum[target[i]];
    if (!s) continue;
    s[0] += data[i * 4];
    s[1] += data[i * 4 + 1];
    s[2] += data[i * 4 + 2];
    s[3]++;
  }
  return sum.map((s) => (s[3] ? rgbToHex(s[0] / s[3], s[1] / s[3], s[2] / s[3]) : '#808080'));
}

/** Aus den Fotofarben eines Rasters wird ein Bild zum Spielen, mit Murmelfarben im gewünschten Abstand. */
export function rasterLevel(name: string, w: number, h: number, raster: PhotoRaster, contrast: PhotoContrast): Level {
  const counts = new Array<number>(raster.source.length).fill(0);
  for (const c of raster.target) if (c >= 0) counts[c]++;
  return makeLevel(name, w, h, toMarbleColors(raster.source, counts, CONTRAST_SPREAD[contrast]), raster.target);
}

/** Aus einem verkleinerten Foto (w × h Bildpunkte, RGBA) wird ein Bild zum Spielen. */
export function photoLevel(
  name: string,
  data: ArrayLike<number>,
  w: number,
  h: number,
  k: number,
  contrast: PhotoContrast = 'naturnah',
): Level | null {
  const raster = photoRaster(data, w, h, k);
  return raster ? rasterLevel(name, w, h, raster, contrast) : null;
}
