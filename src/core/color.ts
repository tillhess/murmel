/** Farbhelfer. Alle Farben sind Hex-Strings der Form #rrggbb. */
export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Mischt a nach b, t = 0 ergibt a, t = 1 ergibt b. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Wahrgenommene Helligkeit 0..255 */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** CIE-Lab (D65). Grundlage für wahrgenommene Farbabstände. */
export function toLab(hex: string): [number, number, number] {
  const lin = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  }) as Rgb;
  const x = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047;
  const y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722;
  const z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Wahrgenommener Farbabstand (ΔE76). Ab etwa 25 sind zwei Murmelfarben sicher auseinanderzuhalten. */
export function deltaE(a: string, b: string): number {
  const A = toLab(a);
  const B = toLab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

/** Kleinster Abstand innerhalb einer Palette, samt dem Paar, das ihn bildet. */
export function minDeltaE(colors: readonly string[]): { value: number; pair: [string, string] } {
  let value = Number.POSITIVE_INFINITY;
  let pair: [string, string] = ['', ''];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const d = deltaE(colors[i], colors[j]);
      if (d < value) {
        value = d;
        pair = [colors[i], colors[j]];
      }
    }
  }
  return { value, pair };
}

/** Buntheit (Chroma C*ab): 0 ist grau, kräftige Farben liegen über 60. */
export function chroma(hex: string): number {
  const [, a, b] = toLab(hex);
  return Math.hypot(a, b);
}

/** Formen der Farbfehlsichtigkeit, für die sich eine Palette prüfen lässt */
export type Vision = 'protan' | 'deutan' | 'tritan';

// Machado, Oliveira & Fernandes (2009): Umrechnung für vollständige Farbfehlsichtigkeit, auf linearem RGB.
const VISION: Record<Vision, readonly (readonly [number, number, number])[]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** So sieht die Farbe für jemanden aus, dem eine der drei Zapfenarten fehlt (Näherung nach Machado et al. 2009). */
export function simulate(hex: string, vision: Vision): string {
  const lin = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  });
  const out = VISION[vision].map((row) => {
    const v = Math.max(0, Math.min(1, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
    return (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;
  });
  return rgbToHex(out[0], out[1], out[2]);
}

/** Kleinster Abstand einer Palette, wie ihn jemand mit dieser Farbfehlsichtigkeit wahrnimmt. */
export function minDeltaEFor(colors: readonly string[], vision: Vision): { value: number; pair: [string, string] } {
  const seen = colors.map((c) => simulate(c, vision));
  const { value, pair } = minDeltaE(seen);
  return { value, pair: [colors[seen.indexOf(pair[0])], colors[seen.lastIndexOf(pair[1])]] };
}
