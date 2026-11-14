import { describe, expect, it } from 'vitest';
import { chroma, minDeltaE, minDeltaEFor } from '../core/color';
import { deal } from '../core/deal';
import { isSolved } from '../core/grid';
import { newState } from '../core/level';
import { makeRng } from '../core/random';
import { colorShares, sceneLevel } from '../core/scene';
import { autoplay } from '../core/solver';
import { SCENES } from './scenes';

describe.each(SCENES.map((s) => [s.name, s] as const))('Motiv %s', (_name, scene) => {
  const level = sceneLevel(scene);
  const shares = colorShares(level);

  it('füllt das ganze Raster', () => {
    expect(level.cells.length).toBe(scene.size * scene.size);
  });

  it('hat Murmelfarben, die sich klar unterscheiden (ΔE mindestens 27)', () => {
    const { value, pair } = minDeltaE(scene.palette);
    expect(value, `zu ähnlich: ${pair.join(' und ')}`).toBeGreaterThanOrEqual(27);
  });

  it.each(['protan', 'deutan'] as const)(
    'bleibt bei Rot-Grün-Sehschwäche unterscheidbar (%s, ΔE mindestens 20)',
    (vision) => {
      const { value, pair } = minDeltaEFor(scene.palette, vision);
      expect(value, `zu ähnlich: ${pair.join(' und ')}`).toBeGreaterThanOrEqual(20);
    },
  );

  it('bleibt ruhig: höchstens eine kräftige Farbe als Akzent, im Mittel gedämpft', () => {
    const strong = scene.palette.filter((c) => chroma(c) > 60);
    expect(strong.length, `kräftig: ${strong.join(', ')}`).toBeLessThanOrEqual(1);
    const mean = scene.palette.reduce((sum, c) => sum + chroma(c), 0) / scene.palette.length;
    expect(mean).toBeLessThanOrEqual(40);
  });

  it('hat einen gedämpften Himmel: Die große Fläche hinter dem Bild drängt sich nicht auf', () => {
    expect(chroma(scene.mood.top)).toBeLessThanOrEqual(40);
    expect(chroma(scene.mood.bottom)).toBeLessThanOrEqual(40);
  });

  it('gibt jeder Farbe genug Murmeln und keiner mehr als 45 % des Bildes', () => {
    shares.forEach((share, k) => {
      expect(share, `Farbe ${scene.palette[k]}`).toBeGreaterThanOrEqual(0.012);
      expect(share, `Farbe ${scene.palette[k]}`).toBeLessThanOrEqual(0.45);
    });
  });

  it('startet ohne eine einzige richtig liegende Murmel und lässt sich zu Ende spielen', () => {
    const cur = deal(level, makeRng(scene.size * 13));
    expect(level.cells.filter((i) => cur[i] === level.target[i]).length).toBe(0);
    const state = newState(cur, 30);
    autoplay(level, state);
    expect(isSolved(level, state.cur)).toBe(true);
  });
});

describe('Motive insgesamt', () => {
  it('haben eindeutige Kennungen und wachsen in der Größe', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    const sizes = SCENES.map((s) => s.size);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });
});
