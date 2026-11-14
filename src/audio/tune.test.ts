import { describe, expect, it } from 'vitest';
import { midiToHz, nextStep, noteAt, restStep, SCALE, Spread, STEPS, startStep, type Walk } from './tune';

describe('Tonvorrat', () => {
  it('rechnet Noten in Frequenzen um', () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(57)).toBeCloseTo(220);
  });

  it('steigt die Fünftonleiter hinauf und setzt sie in der Oktave fort', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((s) => noteAt(50, s))).toEqual([50, 52, 54, 57, 59, 62, 64]);
    expect(noteAt(50, -1)).toBe(47);
  });

  it('enthält keine Halbtonschritte, die sich reiben könnten', () => {
    const notes = Array.from({ length: STEPS + 1 }, (_, s) => noteAt(0, s) % 12);
    for (const a of notes) for (const b of notes) expect([1, 6, 11]).not.toContain((a - b + 12) % 12);
    expect(SCALE).toHaveLength(5);
  });

  it('gibt jeder Farbe eine Anfangslage innerhalb des Tonvorrats', () => {
    for (let color = 0; color < 17; color++) {
      expect(startStep(color)).toBeGreaterThanOrEqual(0);
      expect(startStep(color)).toBeLessThan(STEPS);
    }
    expect(startStep(0)).not.toBe(startStep(1));
  });
});

describe('Tonfolge einer Kette', () => {
  it('bleibt im Tonvorrat und macht nur kleine Schritte', () => {
    let walk: Walk = { step: 0, dir: 1 };
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let k = 0; k < 500; k++) {
      const next = nextStep(walk, rand());
      expect(next.step).toBeGreaterThanOrEqual(0);
      expect(next.step).toBeLessThan(STEPS);
      expect(Math.abs(next.step - walk.step)).toBeLessThanOrEqual(2);
      walk = next;
    }
  });

  it('kehrt an den Rändern um', () => {
    expect(nextStep({ step: STEPS - 1, dir: 1 }, 0.1)).toEqual({ step: STEPS - 2, dir: -1 });
    expect(nextStep({ step: 0, dir: -1 }, 0.1)).toEqual({ step: 1, dir: 1 });
    expect(nextStep({ step: 4, dir: 1 }, 0.9)).toEqual({ step: 3, dir: 1 });
  });

  it('endet auf Grundton oder Quinte', () => {
    expect(restStep(0)).toBe(0);
    expect(restStep(1)).toBe(0);
    expect(restStep(2)).toBe(3);
    expect(restStep(4)).toBe(3);
    expect(restStep(6)).toBe(5);
    expect(restStep(9)).toBe(8);
    for (let s = 0; s < STEPS; s++) expect([0, 3]).toContain(restStep(s) % SCALE.length);
  });

  it('wiederholt am Schluss nicht einfach den Ton davor', () => {
    expect(restStep(5, 5)).toBe(3);
    expect(restStep(0, 0)).toBe(3);
    expect(restStep(9, 8)).toBe(10);
    expect(restStep(4, 2)).toBe(3);
  });
});

describe('Auffächern gleichzeitiger Töne', () => {
  it('lässt einen einzelnen Ton sofort erklingen', () => {
    expect(new Spread(0.1, 0.5).at(3)).toBe(3);
  });

  it('macht aus gleichzeitigen Tönen eine Folge mit festem Abstand', () => {
    const spread = new Spread(0.1, 0.5);
    const times = [0, 0, 0, 0].map(() => spread.at(10));
    expect(times[0]).toBeCloseTo(10);
    expect(times[1]).toBeCloseTo(10.1);
    expect(times[2]).toBeCloseTo(10.2);
    expect(times[3]).toBeCloseTo(10.3);
  });

  it('lässt weg, was dem Bild zu weit hinterherliefe', () => {
    const spread = new Spread(0.1, 0.25);
    const times = Array.from({ length: 6 }, () => spread.at(0));
    expect(times.filter((t) => t !== null)).toHaveLength(3);
    expect(times[5]).toBeNull();
  });

  it('lässt einen Schlusston länger warten, aber nicht beliebig lange', () => {
    const spread = new Spread(0.1, 0.25);
    for (let k = 0; k < 3; k++) spread.at(0);
    expect(spread.at(0, true)).toBeCloseTo(0.3);
    expect(spread.at(0, true)).toBeCloseTo(0.4);
    expect(spread.at(0, true)).toBeCloseTo(0.5);
    expect(spread.at(0, true)).toBeCloseTo(0.6);
    expect(spread.at(0, true)).toBeNull();
  });

  it('holt nach einer Pause nichts nach', () => {
    const spread = new Spread(0.1, 0.5);
    spread.at(0);
    expect(spread.at(5)).toBe(5);
  });
});
