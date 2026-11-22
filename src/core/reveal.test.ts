import { describe, expect, it } from 'vitest';
import { REVEAL_MS, revealProgress } from './reveal';

describe('Weiches Sichtbarwerden der Bildfarbe', () => {
  it('wartet ohne Farbänderung auf die letzte Ankunft', () => {
    expect(revealProgress(null, 100000)).toBe(0);
    expect(revealProgress(2000, 1999)).toBe(0);
    expect(revealProgress(2000, 2000)).toBe(0);
  });
  it('blendet eine Sekunde lang stetig bis zum vollständigen Bild über', () => {
    expect(revealProgress(2000, 2500)).toBe(0.5);
    expect(revealProgress(2000, 2000 + REVEAL_MS)).toBe(1);
    expect(revealProgress(2000, 5000)).toBe(1);
    let previous = 0;
    for (let elapsed = 0; elapsed <= REVEAL_MS; elapsed += 10) {
      const current = revealProgress(2000, 2000 + elapsed);
      expect(current).toBeGreaterThanOrEqual(previous);
      expect(current - previous).toBeLessThan(0.016);
      previous = current;
    }
  });
  it('beginnt und endet sanft', () => {
    expect(revealProgress(0, 10)).toBeLessThan(0.001);
    expect(1 - revealProgress(0, REVEAL_MS - 10)).toBeLessThan(0.001);
  });
});
