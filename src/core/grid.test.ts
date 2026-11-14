import { describe, expect, it } from 'vitest';
import { colorDone, isSolved, remaining } from './grid';
import { EMPTY } from './level';
import { levelFromRows } from './testing';

describe('Stand des Bildes', () => {
  const level = levelFromRows(['AAB', 'BBB']);

  it('zählt, was noch nicht an seinem Platz liegt', () => {
    expect(remaining(level, new Int16Array([0, 0, 1, 1, 1, 1]))).toBe(0);
    expect(isSolved(level, new Int16Array([0, 0, 1, 1, 1, 1]))).toBe(true);
    expect(remaining(level, new Int16Array([1, 0, 1, 0, EMPTY, 1]))).toBe(3);
  });

  it('erkennt, wann eine Farbe vollständig ist', () => {
    const cur = new Int16Array([0, 0, 1, EMPTY, 1, 1]);
    expect(colorDone(level, cur, 0)).toBe(true);
    expect(colorDone(level, cur, 1)).toBe(false);
    cur[3] = 1;
    expect(colorDone(level, cur, 1)).toBe(true);
    // eine Farbe, die im Bild gar nicht vorkommt, ist nie "vollständig"
    expect(colorDone(level, cur, 2)).toBe(false);
  });
});
