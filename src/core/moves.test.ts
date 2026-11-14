import { describe, expect, it } from 'vitest';
import { deal } from './deal';
import { around, neighbors, regionAt } from './grid';
import { EMPTY, type Level, newState, type State } from './level';
import { freeSlots, hasFreeHole, park, place, type Selection, selectCell, selectSlot, trayCount } from './moves';
import { makeRng, randInt } from './random';
import { holeCount, levelFromRows, marbleCounts, patchLevel, targetCounts } from './testing';

/** Zwei getrennte freie Bereiche der Farbe A (links und rechts), in der Ablage liegen die vier fehlenden B. */
function twoRegions(): { level: Level; state: State } {
  const level = levelFromRows(['AABAA', 'BBBBB']);
  const state = newState(new Int16Array([-1, -1, 1, -1, -1, 0, 0, 0, 0, 1]), 6);
  state.tray.set([1, 1, 1, 1]);
  return { level, state };
}

describe('Auswählen', () => {
  it('wählt die Murmel samt allen angrenzenden Murmeln derselben Farbe', () => {
    const { level, state } = twoRegions();
    const sel = selectCell(level, state, 6) as Selection & { source: 'board' };
    expect(sel.color).toBe(0);
    expect([...sel.cells].sort()).toEqual([5, 6, 7, 8]);
  });

  it('wählt nichts auf leeren Löchern und auf Murmeln, die schon richtig liegen', () => {
    const { level, state } = twoRegions();
    expect(selectCell(level, state, 0)).toBeNull();
    expect(selectCell(level, state, 2)).toBeNull();
    expect(selectCell(level, state, 9)).toBeNull();
  });

  it('wählt in der Ablage alle Murmeln einer Farbe', () => {
    const { state } = twoRegions();
    state.tray[5] = 0;
    expect(selectSlot(state, 1)).toEqual({ source: 'tray', color: 1, slots: [0, 1, 2, 3] });
    expect(selectSlot(state, 5)).toEqual({ source: 'tray', color: 0, slots: [5] });
    expect(selectSlot(state, 4)).toBeNull();
  });
});

describe('Ins Bild legen', () => {
  it('füllt nur den angetippten Bereich, der Rest der Auswahl bleibt liegen', () => {
    const { level, state } = twoRegions();
    const sel = selectCell(level, state, 6) as Selection;
    const result = place(level, state, sel, 0);
    expect(result.ok).toBe(true);
    // links gefüllt, rechts weiterhin frei
    expect(Array.from(state.cur.slice(0, 5))).toEqual([0, 0, 1, EMPTY, EMPTY]);
    // die zwei Murmeln, die dem Loch am nächsten lagen, sind weg; zwei bleiben
    expect(Array.from(state.cur.slice(5))).toEqual([EMPTY, EMPTY, 0, 0, 1]);
  });

  it('lässt die vorderste Murmel ins hinterste Loch rollen', () => {
    const { level, state } = twoRegions();
    const result = place(level, state, selectCell(level, state, 6) as Selection, 0);
    if (!result.ok) throw new Error('abgelehnt');
    expect(result.rolls).toEqual([
      { color: 0, from: { cell: 5 }, to: { cell: 1 }, via: [{ cell: 0 }, { cell: 1 }] },
      { color: 0, from: { cell: 6 }, to: { cell: 0 }, via: [{ cell: 0 }] },
    ]);
  });

  it('lehnt falsche Farbe und belegte Felder ab und ändert dann nichts', () => {
    const { level, state } = twoRegions();
    const before = Array.from(state.cur);
    const ones = selectSlot(state, 0) as Selection;
    expect(place(level, state, ones, 0)).toEqual({ ok: false, reason: 'falsche-farbe' });
    expect(place(level, state, ones, 2)).toEqual({ ok: false, reason: 'kein-loch' });
    expect(Array.from(state.cur)).toEqual(before);
  });

  it('legt Murmeln aus der Ablage in die frei gewordenen Löcher', () => {
    const { level, state } = twoRegions();
    place(level, state, selectCell(level, state, 6) as Selection, 0);
    const result = place(level, state, selectSlot(state, 0) as Selection, 5);
    if (!result.ok) throw new Error('abgelehnt');
    expect(result.rolls.length).toBe(2);
    expect(Array.from(state.cur.slice(5))).toEqual([1, 1, 0, 0, 1]);
    expect(Array.from(state.tray)).toEqual([EMPTY, EMPTY, 1, 1, EMPTY, EMPTY]);
  });

  it('führt jeden Weg vom Einstieg lückenlos über Nachbarfelder zum Ziel', () => {
    const level = patchLevel(14, 14, 4, 21);
    const state = newState(deal(level, makeRng(4)), 30);
    const first = selectCell(level, state, level.cells[0]) as Selection & { source: 'board' };
    const parked = park(level, state, first);
    if (!parked.ok) throw new Error('abgelehnt');
    // irgendeine Gruppe, die in die frei gewordenen Löcher passt
    for (const i of level.cells) {
      const sel = selectCell(level, state, i);
      if (!sel) continue;
      const hole = level.cells.find((h) => state.cur[h] === EMPTY && level.target[h] === sel.color);
      if (hole === undefined) continue;
      const result = place(level, state, sel, hole);
      if (!result.ok) throw new Error('abgelehnt');
      for (const roll of result.rolls) {
        const via = roll.via.map((s) => ('cell' in s ? s.cell : -1));
        expect(via[0]).toBe(hole);
        expect(via[via.length - 1]).toBe('cell' in roll.to ? roll.to.cell : -1);
        // jeder Schritt führt auf ein angrenzendes Feld, über die Kante oder über Eck
        for (let k = 1; k < via.length; k++) expect(around(level, via[k - 1])).toContain(via[k]);
      }
      return;
    }
    throw new Error('kein passender Zug gefunden');
  });
});

describe('Ziele, die nur über Eck zusammenhängen', () => {
  it('zählen als ein Bereich und füllen sich in einem Zug', () => {
    // A gehört auf die Diagonale: oben links und unten rechts sind frei, die beiden B liegen schon richtig
    const level = levelFromRows(['AB', 'BA']);
    const state = newState(new Int16Array([EMPTY, 1, 1, EMPTY]), 4);
    state.tray.set([0, 0]);
    expect(regionAt(level, state.cur, 0)).toEqual([0, 3]);

    const result = place(level, state, selectSlot(state, 0) as Selection, 0);
    if (!result.ok) throw new Error('abgelehnt');
    expect(Array.from(state.cur)).toEqual([0, 1, 1, 0]);
    expect(trayCount(state)).toBe(0);
    // die vorderste Murmel rollt über Eck ins hintere Loch, die zweite bleibt im Einstieg
    expect(result.rolls[0]).toMatchObject({ to: { cell: 3 }, via: [{ cell: 0 }, { cell: 3 }] });
    expect(result.rolls[1]).toMatchObject({ to: { cell: 0 }, via: [{ cell: 0 }] });
  });

  it('rollen geradeaus, wo es geht, und über Eck nur, wo es sein muss', () => {
    // freier Bereich für A: eine Reihe von drei Löchern, dazu eins, das nur über Eck anschließt
    const level = levelFromRows(['AAAB', 'BBBA']);
    const state = newState(new Int16Array([EMPTY, EMPTY, EMPTY, 1, 1, 1, 1, EMPTY]), 6);
    state.tray.set([0, 0, 0, 0]);
    expect(regionAt(level, state.cur, 0)).toEqual([0, 1, 2, 7]);

    const result = place(level, state, selectSlot(state, 0) as Selection, 0);
    if (!result.ok) throw new Error('abgelehnt');
    const cells = (k: number) => result.rolls[k].via.map((s) => ('cell' in s ? s.cell : -1));
    expect(cells(0)).toEqual([0, 1, 2, 7]);
    for (const roll of result.rolls) {
      const via = roll.via.map((s) => ('cell' in s ? s.cell : -1));
      // nur der letzte Schritt ins abseits liegende Loch führt über Eck
      for (let k = 1; k < via.length; k++) {
        if (via[k] !== 7) expect(neighbors(level, via[k - 1])).toContain(via[k]);
      }
    }
    expect(Array.from(state.cur)).toEqual([0, 0, 0, 1, 1, 1, 1, 0]);
  });

  it('verbinden auch die Auswahl über Eck', () => {
    const level = levelFromRows(['BA', 'AB']);
    // zwei A liegen falsch und berühren sich nur über Eck
    const state = newState(new Int16Array([0, EMPTY, EMPTY, 0]), 4);
    const sel = selectCell(level, state, 0) as Selection & { source: 'board' };
    expect(sel.cells).toEqual([0, 3]);
  });
});

describe('In die Ablage legen', () => {
  it('ordnet das Brett nach Farben: Neue Murmeln kommen zu ihrer Farbe, die anderen rücken zusammen', () => {
    const level = levelFromRows(['BBB', 'AAA']);
    const state = newState(new Int16Array([0, 0, 0, EMPTY, EMPTY, EMPTY]), 8);
    // auf dem Brett liegen verstreut: A, Lücke, B, B, Lücke, C
    state.tray.set([0, EMPTY, 1, 1, EMPTY, 2]);
    const result = park(level, state, selectCell(level, state, 0) as Selection);
    if (!result.ok) throw new Error('abgelehnt');
    expect(Array.from(state.tray)).toEqual([0, 0, 0, 0, 1, 1, 2, EMPTY]);
    expect(result.rolls.map((r) => ('slot' in r.to ? r.to.slot : -1)).sort()).toEqual([1, 2, 3]);
  });

  it('legt eine Farbe, die noch nicht auf dem Brett liegt, hinten an', () => {
    const level = levelFromRows(['BB', 'AA']);
    const state = newState(new Int16Array([0, 0, EMPTY, EMPTY]), 6);
    state.tray.set([EMPTY, 1, EMPTY, 1]);
    const result = park(level, state, selectCell(level, state, 0) as Selection);
    if (!result.ok) throw new Error('abgelehnt');
    expect(Array.from(state.tray)).toEqual([1, 1, 0, 0, EMPTY, EMPTY]);
  });

  it('nimmt die Murmeln, die der Ablage am nächsten liegen, wenn nicht für alle Platz ist', () => {
    const level = levelFromRows(['BB', 'BB', 'AA', 'AA']);
    const state = newState(new Int16Array([0, 0, 0, 0, 1, 1, 1, 1]), 3);
    state.tray[0] = 1; // schon belegt (für den Test ohne Rücksicht auf die Murmelbilanz)
    const sel = selectCell(level, state, 0) as Selection;
    const result = park(level, state, sel);
    if (!result.ok) throw new Error('abgelehnt');
    // nur zwei Mulden frei: die beiden unteren Murmeln der Gruppe rollen
    expect(Array.from(state.cur.slice(0, 4))).toEqual([0, 0, EMPTY, EMPTY]);
    expect(Array.from(state.tray)).toEqual([1, 0, 0]);
    expect(result.rolls.map((r) => r.to)).toEqual([{ slot: 2 }, { slot: 1 }]);
    expect(result.rolls[0].via).toEqual([{ slot: 1 }, { slot: 2 }]);
  });

  it('lehnt ab, wenn die Ablage voll ist oder die Auswahl schon dort liegt', () => {
    const level = levelFromRows(['AB']);
    const state = newState(new Int16Array([1, 0]), 1);
    state.tray[0] = 0;
    expect(park(level, state, selectCell(level, state, 0) as Selection)).toEqual({ ok: false, reason: 'ablage-voll' });
    expect(park(level, state, selectSlot(state, 0) as Selection)).toEqual({
      ok: false,
      reason: 'liegt-schon-in-ablage',
    });
  });
});

describe('Spielregeln bleiben über viele Züge gültig', () => {
  it('verliert keine Murmel, und es gibt immer genau so viele Löcher wie Murmeln in der Ablage', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const level = patchLevel(12, 12, 3 + (seed % 4), seed);
      const state = newState(deal(level, makeRng(seed)), 12);
      const rng = makeRng(seed * 31);
      const expected = targetCounts(level);
      for (let step = 0; step < 300; step++) {
        // Zufallsspieler: irgendeine Auswahl, dann irgendein erlaubtes Ziel
        const slots = [...state.tray.keys()].filter((s) => state.tray[s] !== EMPTY);
        const useTray = slots.length > 0 && rng() < 0.4;
        const sel = useTray
          ? selectSlot(state, slots[randInt(rng, slots.length)])
          : selectCell(level, state, level.cells[randInt(rng, level.cells.length)]);
        if (!sel) continue;
        const holes = level.cells.filter((h) => state.cur[h] === EMPTY && level.target[h] === sel.color);
        if (holes.length) place(level, state, sel, holes[randInt(rng, holes.length)]);
        else if (sel.source === 'board') park(level, state, sel);
        expect(marbleCounts(level, state)).toEqual(expected);
        expect(holeCount(level, state)).toBe(trayCount(state));
      }
    }
  });

  it('kennt keine Sackgasse: Liegt etwas in der Ablage, passt immer eine Murmel in ein Loch', () => {
    const level = patchLevel(10, 10, 5, 13);
    const state = newState(deal(level, makeRng(2)), 3);
    const rng = makeRng(77);
    for (let step = 0; step < 400; step++) {
      if (trayCount(state) > 0) {
        const colors = new Set<number>();
        for (const i of level.cells)
          if (state.cur[i] !== EMPTY && state.cur[i] !== level.target[i]) colors.add(state.cur[i]);
        for (const c of state.tray) if (c !== EMPTY) colors.add(c);
        expect([...colors].some((c) => hasFreeHole(level, state, c))).toBe(true);
      }
      const sel = selectCell(level, state, level.cells[randInt(rng, level.cells.length)]);
      if (!sel) continue;
      const hole = level.cells.find((h) => state.cur[h] === EMPTY && level.target[h] === sel.color);
      if (hole !== undefined) place(level, state, sel, hole);
      else if (freeSlots(state).length) park(level, state, sel);
      else {
        // Ablage voll und diese Gruppe passt nirgends: Dann passt eine andere Murmel, aus der Ablage oder vom Brett.
        const slot = [...state.tray.keys()].find((s) => hasFreeHole(level, state, state.tray[s]));
        const cell = level.cells.find(
          (i) => state.cur[i] !== EMPTY && state.cur[i] !== level.target[i] && hasFreeHole(level, state, state.cur[i]),
        );
        const other =
          slot !== undefined ? selectSlot(state, slot) : cell !== undefined ? selectCell(level, state, cell) : null;
        if (!other) throw new Error('Sackgasse');
        const h = level.cells.find((x) => state.cur[x] === EMPTY && level.target[x] === other.color) as number;
        expect(place(level, state, other, h).ok).toBe(true);
      }
    }
  });
});
