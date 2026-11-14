import { describe, expect, it } from 'vitest';
import { hexToRgb, minDeltaE } from './color';
import {
  CONTRAST_SPREAD,
  MARBLE_COLORS,
  photoLevel,
  photoRaster,
  quantize,
  rasterLevel,
  sourceColors,
  toMarbleColors,
} from './quantize';
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

describe('Farbabstand eigener Fotos', () => {
  // ein Foto aus lauter Braun- und Dunkeltönen
  const browns = ['#2a1c14', '#4a3020', '#6b4428', '#8a5a34', '#3a2a30', '#1c1a22', '#a57a50'];
  const counts = [7, 6, 5, 4, 3, 2, 1];
  const dark = [MARBLE_COLORS.schwarz, MARBLE_COLORS.dunkelblau, MARBLE_COLORS.dunkelrot, MARBLE_COLORS.braun];

  it('naturnah bleibt nah am Foto und nimmt dafür mehrere dunkle Murmeln', () => {
    const colors = toMarbleColors(browns, counts);
    expect(colors.filter((c) => dark.includes(c)).length).toBeGreaterThanOrEqual(3);
  });

  it('je stärker die Einstellung, desto weiter liegen die Murmelfarben auseinander', () => {
    const natural = minDeltaE(toMarbleColors(browns, counts)).value;
    const clear = minDeltaE(toMarbleColors(browns, counts, CONTRAST_SPREAD.deutlich)).value;
    const strong = minDeltaE(toMarbleColors(browns, counts, CONTRAST_SPREAD.kraeftig)).value;
    expect(clear).toBeGreaterThan(natural + 5);
    expect(strong).toBeGreaterThanOrEqual(clear);
    expect(clear).toBeGreaterThanOrEqual(40);
  });

  it('deutlich legt nie zwei dunkle Murmeln nebeneinander, solange der Satz reicht', () => {
    const colors = toMarbleColors(browns, counts, CONTRAST_SPREAD.deutlich);
    expect(new Set(colors).size).toBe(browns.length);
    expect(colors.filter((c) => dark.includes(c)).length).toBeLessThanOrEqual(2);
  });

  it('die häufigste Farbe behält ihre naturnahe Murmel', () => {
    for (const spread of Object.values(CONTRAST_SPREAD)) {
      expect(toMarbleColors(browns, counts, spread)[0]).toBe(toMarbleColors(browns, counts)[0]);
    }
  });

  it('auch mit zehn Farben bekommt jede eine eigene Murmel', () => {
    const many = [...browns, '#5a4a3a', '#30241c', '#7a6048'];
    const colors = toMarbleColors(
      many,
      many.map((_, i) => 10 - i),
      CONTRAST_SPREAD.kraeftig,
    );
    expect(new Set(colors).size).toBe(many.length);
  });

  it('die Einstellung ändert nur die Farben, nicht die Felder', () => {
    const w = 8;
    const data = new Uint8ClampedArray(w * w * 4);
    for (let i = 0; i < w * w; i++) data.set([...hexToRgb(browns[i % 4]), 255], i * 4);
    const raster = photoRaster(data, w, w, 7);
    expect(raster).not.toBeNull();
    if (!raster) return;
    const a = rasterLevel('a', w, w, raster, 'naturnah');
    const b = rasterLevel('b', w, w, raster, 'kraeftig');
    expect([...b.target]).toEqual([...a.target]);
    expect(b.palette).not.toEqual(a.palette);
    expect(a.palette).toEqual(photoLevel('a', data, w, w, 7)?.palette);
    // aus Foto und Feldern lassen sich die Fotofarben wiederfinden
    expect(sourceColors(data, raster.target, raster.source.length)).toEqual(raster.source);
  });
});
