import { describe, expect, it } from 'vitest';
import { minDeltaE } from './color';
import { MARBLE_COLORS, photoLevel, quantize, toMarbleColors } from './quantize';
import { makeRng } from './random';
import { colorShares } from './scene';

/** Testbild: Bildpunkte aus einer Funktion (x, y) → [r, g, b, a] */
function image(w: number, h: number, at: (x: number, y: number) => number[]): number[] {
  const data: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.push(...at(x, y));
  return data;
}

describe('Farbreduktion für eigene Fotos', () => {
  it('hält den Murmel-Farbsatz gut unterscheidbar', () => {
    expect(minDeltaE(Object.values(MARBLE_COLORS)).value).toBeGreaterThan(30);
  });

  it('findet die Farben eines einfachen Bildes', () => {
    const data = image(12, 12, (x, y) =>
      y < 4 ? [200, 30, 30, 255] : x < 6 ? [30, 30, 200, 255] : [240, 240, 240, 255],
    );
    const q = quantize(data, 144, 3);
    expect(q?.palette).toEqual(['#1e1ec8', '#c81e1e', '#f0f0f0']);
    expect(q?.index[0]).toBe(1);
    expect(q?.index[143]).toBe(2);
  });

  it('lässt durchsichtige Bildpunkte aus', () => {
    const data = image(4, 4, (x) => (x < 2 ? [0, 0, 0, 0] : x === 2 ? [250, 250, 250, 255] : [10, 10, 10, 255]));
    const q = quantize(data, 16, 4);
    expect(q?.index[0]).toBe(-1);
    expect(q?.palette.length).toBe(2);
    expect(
      quantize(
        image(2, 2, () => [0, 0, 0, 0]),
        4,
        3,
      ),
    ).toBeNull();
  });

  it('teilt eine übergroße Farbfläche, damit keine Farbe mehr als die Hälfte belegt', () => {
    const rng = makeRng(3);
    // 80 % Himmel mit leichtem Verlauf, dazu zwei kleine Farbflächen
    const data = image(30, 30, (x, y) => {
      if (y >= 24) return x < 15 ? [40, 120, 50, 255] : [200, 160, 60, 255];
      return [60 + y * 3 + rng() * 6, 110 + y * 3, 190 + y * 2, 255];
    });
    const level = photoLevel('Himmel', data, 30, 30, 4);
    if (!level) throw new Error('kein Bild');
    expect(Math.max(...colorShares(level))).toBeLessThanOrEqual(0.5);
  });

  it('gibt jeder Bildfarbe eine eigene, klar unterscheidbare Murmelfarbe', () => {
    const colors = toMarbleColors(['#102a5c', '#17306a', '#0f6f80', '#e87f2a', '#f4efe6'], [500, 400, 200, 80, 60]);
    expect(new Set(colors).size).toBe(5);
    expect(minDeltaE(colors).value).toBeGreaterThan(30);
    // bunte Farben werden nicht grau
    expect(colors).not.toContain(MARBLE_COLORS.grau);
  });
});
