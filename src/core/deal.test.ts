import { describe, expect, it } from 'vitest';
import { deal } from './deal';
import { components } from './grid';
import { makeLevel } from './level';
import { makeRng } from './random';
import { patchLevel, targetCounts } from './testing';

describe('Startaufstellung', () => {
  it('legt keine Murmel auf ihre Zielfarbe', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const level = patchLevel(10 + (seed % 5) * 6, 10 + (seed % 4) * 5, 3 + (seed % 6), seed);
      const share = Math.max(...targetCounts(level)) / level.cells.length;
      if (share > 0.5) continue; // dann ist es rechnerisch unmöglich, siehe eigener Test
      const cur = deal(level, makeRng(seed * 7));
      const onOwnColor = level.cells.filter((i) => cur[i] === level.target[i]).length;
      expect(onOwnColor, `Saat ${seed}`).toBe(0);
    }
  });

  it('verteilt genau die Murmeln des Bildes und lässt kein Feld leer', () => {
    const level = patchLevel(24, 18, 6, 3);
    const cur = deal(level, makeRng(11));
    const counts = new Array<number>(level.palette.length).fill(0);
    for (const i of level.cells) {
      expect(cur[i]).toBeGreaterThanOrEqual(0);
      counts[cur[i]]++;
    }
    expect(counts).toEqual(targetCounts(level));
  });

  it('bildet zusammenhängende Flecken statt einzelner Murmeln', () => {
    const level = patchLevel(24, 24, 6, 5);
    const cur = deal(level, makeRng(99));
    const { groups } = components(level, cur);
    const mean = level.cells.length / groups.length;
    expect(mean).toBeGreaterThan(4);
    expect(Math.max(...groups.map((g) => g.cells.length))).toBeGreaterThanOrEqual(10);
  });

  it('ist mit gleicher Saat wiederholbar', () => {
    const level = patchLevel(16, 16, 5, 8);
    expect(Array.from(deal(level, makeRng(42)))).toEqual(Array.from(deal(level, makeRng(42))));
    expect(Array.from(deal(level, makeRng(42)))).not.toEqual(Array.from(deal(level, makeRng(43))));
  });

  it('lässt bei einer übergroßen Farbe nur so viele Murmeln richtig liegen wie unvermeidbar', () => {
    // 70 von 100 Feldern haben Farbe 0: höchstens 30 dieser Murmeln finden ein fremdes Feld.
    const target = new Int16Array(100).fill(0);
    for (let i = 70; i < 100; i++) target[i] = 1 + (i % 2);
    const level = makeLevel('einseitig', 10, 10, ['#111111', '#888888', '#eeeeee'], target);
    const cur = deal(level, makeRng(5));
    const onOwnColor = level.cells.filter((i) => cur[i] === level.target[i]).length;
    expect(onOwnColor).toBe(70 - 30);
  });

  it('ignoriert Felder, die nicht zum Bild gehören', () => {
    const target = new Int16Array([0, 0, -1, 1, 1, -1, 0, 1, 1]);
    const level = makeLevel('Lücken', 3, 3, ['#aa0000', '#0000aa'], target);
    const cur = deal(level, makeRng(1));
    expect(cur[2]).toBe(-1);
    expect(cur[5]).toBe(-1);
  });
});
