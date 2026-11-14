import { describe, expect, it } from 'vitest';
import { deal } from './deal';
import { isSolved } from './grid';
import { newState } from './level';
import { trayCount } from './moves';
import { makeRng } from './random';
import { autoplay } from './solver';
import { patchLevel } from './testing';

describe('Löser', () => {
  it('spielt jedes Bild zu Ende und räumt die Ablage leer', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const level = patchLevel(8 + (seed % 5) * 5, 8 + (seed % 3) * 6, 3 + (seed % 6), seed);
      const state = newState(deal(level, makeRng(seed)), 30);
      const moves = autoplay(level, state);
      expect(isSolved(level, state.cur), `Saat ${seed}`).toBe(true);
      expect(trayCount(state)).toBe(0);
      expect(moves).toBeLessThanOrEqual(level.cells.length * 2);
    }
  });

  it('kommt auch mit einer einzigen Mulde ans Ziel', () => {
    const level = patchLevel(12, 12, 5, 4);
    const state = newState(deal(level, makeRng(9)), 1);
    autoplay(level, state);
    expect(isSolved(level, state.cur)).toBe(true);
  });

  it('macht mit großer Ablage größere Züge als mit kleiner', () => {
    const level = patchLevel(24, 24, 6, 17);
    const small = autoplay(level, newState(deal(level, makeRng(3)), 2));
    const large = autoplay(level, newState(deal(level, makeRng(3)), 30));
    expect(large).toBeLessThan(small);
  });
});
