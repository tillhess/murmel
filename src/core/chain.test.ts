import { describe, expect, it } from 'vitest';
import { chainDuration, type Pt, runDuration, runEntryTime, runPosition, scheduleChain } from './chain';

const opts = { speed: 0.5, spacing: 20 }; // 0,5 px/ms, also 40 ms Abstand am Einstieg

describe('Rollende Kette', () => {
  const entry: Pt = [100, 0];
  const paths: Pt[][] = [
    [[0, 0], entry, [100, 50], [100, 100]], // vorderste Murmel: weitester Weg
    [[40, 30], entry, [100, 50]],
    [[100, 80], entry],
  ];
  const runs = scheduleChain(paths, opts);

  it('lässt die Murmeln nacheinander im festen Abstand durch den Einstieg rollen', () => {
    const atEntry = runs.map((r) => r.start + r.cum[1] / opts.speed);
    expect(atEntry[1] - atEntry[0]).toBeCloseTo(40);
    expect(atEntry[2] - atEntry[1]).toBeCloseTo(40);
  });

  it('startet keine Murmel vor Beginn des Zugs, und mindestens eine sofort', () => {
    expect(Math.min(...runs.map((r) => r.start))).toBeCloseTo(0);
  });

  it('bewegt eine Murmel entlang ihres Wegs bis ins Ziel', () => {
    const r = runs[0];
    expect(runPosition(r, r.start - 10, opts.speed)).toMatchObject({ x: 0, y: 0, rolled: 0, done: false });
    const mid = runPosition(r, r.start + 100, opts.speed); // 50 px gerollt, noch vor dem Einstieg
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(0);
    const end = runPosition(r, r.start + 1000, opts.speed);
    expect(end).toMatchObject({ x: 100, y: 100, done: true });
    expect(end.rolled).toBeCloseTo(200);
  });

  it('weiß, wann die Kette angekommen ist', () => {
    expect(chainDuration(runs, opts.speed)).toBeCloseTo(runs[0].start + 400);
  });

  it('lässt die Murmeln auf dem letzten Stück ausrollen', () => {
    const soft = scheduleChain(paths, { ...opts, ease: 40 });
    const r = soft[0];
    // gleichmäßig bis 40 px vor dem Ziel, danach langsamer: Das Ausrollen kostet Zeit
    expect(runDuration(r, opts.speed)).toBeGreaterThan(r.length / opts.speed);
    expect(runPosition(r, r.start + 100, opts.speed).rolled).toBeCloseTo(50);
    let last = -1;
    let lastStep = Number.POSITIVE_INFINITY;
    const end = r.start + runDuration(r, opts.speed);
    for (let t = end - 110; t <= end; t += 10) {
      const { rolled } = runPosition(r, t, opts.speed);
      expect(rolled).toBeGreaterThan(last);
      if (last >= 0) {
        // jeder Schritt ist höchstens so groß wie der vorige
        expect(rolled - last).toBeLessThanOrEqual(lastStep + 1e-9);
        lastStep = rolled - last;
      }
      last = rolled;
    }
    expect(runPosition(r, end, opts.speed)).toMatchObject({ x: 100, y: 100, done: true });
    expect(runPosition(r, end - 1, opts.speed).done).toBe(false);
    // am Ziel noch mit zwei Fünfteln des Tempos unterwegs: 10 ms vor Schluss fehlen gut 2 px statt 5
    expect(r.length - runPosition(r, end - 10, opts.speed).rolled).toBeCloseTo(2.1, 0);
    expect(chainDuration(soft, opts.speed)).toBeGreaterThan(chainDuration(runs, opts.speed));
  });

  it('rollt auf kurzen Wegen über die ganze Strecke aus', () => {
    const [run] = scheduleChain(
      [
        [
          [0, 0],
          [10, 0],
        ],
      ],
      { ...opts, ease: 40 },
    );
    expect(runDuration(run, opts.speed)).toBeCloseTo(10 / ((opts.speed * 1.4) / 2));
    expect(runPosition(run, 1000, opts.speed)).toMatchObject({ x: 10, y: 0, done: true });
  });

  it('kommt mit einer Murmel zurecht, die schon am Einstieg liegt', () => {
    const [run] = scheduleChain([[entry, entry]], opts);
    expect(run.length).toBe(0);
    expect(runPosition(run, 0, opts.speed).done).toBe(true);
    expect(runEntryTime(run, opts.speed)).toBe(run.start);
  });

  it('meldet den angetippten Einstieg vor dem endgültigen Ziel', () => {
    const soft = scheduleChain(paths, { ...opts, ease: 40 });
    const first = soft[0];
    const at = runEntryTime(first, opts.speed);
    expect(runPosition(first, at, opts.speed)).toMatchObject({ x: 100, y: 0, done: false });
    expect(at).toBeLessThan(first.start + runDuration(first, opts.speed));
    expect(runPosition(first, at - 1, opts.speed).rolled).toBeLessThan(first.entry);
  });

  it('berücksichtigt Ausrollen, wenn Einstieg und endgültiges Loch zusammenfallen', () => {
    const [run] = scheduleChain(
      [
        [
          [0, 0],
          [10, 0],
        ],
      ],
      { ...opts, ease: 40 },
    );
    const at = runEntryTime(run, opts.speed);
    expect(at).toBeCloseTo(run.start + runDuration(run, opts.speed));
    expect(runPosition(run, at, opts.speed).rolled).toBeCloseTo(run.entry);
  });

  it('erkennt den Einstieg auch innerhalb der Bremsstrecke und nach einem doppelten Wegpunkt', () => {
    const [braking, duplicate] = scheduleChain(
      [
        [
          [0, 0],
          [90, 0],
          [100, 0],
        ],
        [entry, entry, [200, 0]],
      ],
      { ...opts, ease: 40 },
    );
    expect(runPosition(braking, runEntryTime(braking, opts.speed), opts.speed).rolled).toBeCloseTo(90);
    expect(runEntryTime(duplicate, opts.speed)).toBe(duplicate.start);
  });
});
