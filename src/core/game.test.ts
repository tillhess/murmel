import { describe, expect, it } from 'vitest';
import { Game } from './game';
import { EMPTY, newState } from './level';
import { trayCount } from './moves';
import { makeRng } from './random';
import { suggest } from './solver';
import { levelFromRows, patchLevel } from './testing';

/** Brett: oben gehört A hin, unten B; alle vier Murmeln liegen vertauscht. */
function swapped(): Game {
  const level = levelFromRows(['AA', 'BB']);
  return new Game(level, newState(new Int16Array([1, 1, 0, 0]), 4));
}

describe('Spielsteuerung', () => {
  it('wählt beim ersten Tipp die Gruppe und sagt, ob schon ein Loch frei ist', () => {
    const game = swapped();
    const out = game.tapCell(0);
    expect(out).toMatchObject({ type: 'gewählt', hatLoch: false });
    expect(game.selection?.color).toBe(1);
  });

  it('hebt die Auswahl auf, wenn man sie erneut oder daneben antippt', () => {
    const game = swapped();
    game.tapCell(0);
    expect(game.tapCell(1)).toEqual({ type: 'abgewählt' });
    game.tapCell(0);
    expect(game.tapOutside()).toEqual({ type: 'abgewählt' });
    expect(game.tapOutside()).toEqual({ type: 'nichts' });
  });

  it('spielt ein kleines Bild in drei Zügen zu Ende', () => {
    const game = swapped();
    game.tapCell(0);
    expect(game.tapTray(null)).toMatchObject({ type: 'gerollt', ziel: 'ablage', fertig: false });
    expect(Array.from(game.state.cur)).toEqual([EMPTY, EMPTY, 0, 0]);

    game.tapCell(2);
    expect(game.tapCell(0)).toMatchObject({ type: 'gerollt', ziel: 'bild', fertig: false });

    expect(game.tapTray(0)).toMatchObject({ type: 'gewählt', hatLoch: true });
    const last = game.tapCell(2);
    expect(last).toMatchObject({ type: 'gerollt', ziel: 'bild', fertig: true });
    expect(game.solved).toBe(true);
    expect(trayCount(game.state)).toBe(0);
  });

  it('lehnt ein Loch ohne Auswahl und ein Loch der falschen Farbe freundlich ab', () => {
    const game = swapped();
    game.tapCell(0);
    game.tapTray(null);
    expect(game.tapCell(0)).toEqual({ type: 'abgelehnt', reason: 'nichts-gewählt' });
    game.tapTray(0); // die geparkten B wählen
    expect(game.tapCell(0)).toEqual({ type: 'abgelehnt', reason: 'falsche-farbe' });
    expect(game.selection).not.toBeNull(); // die Auswahl bleibt, man darf es noch einmal versuchen
  });

  it('meldet Murmeln, die schon richtig liegen, ohne die Auswahl zu ändern', () => {
    const level = levelFromRows(['AB']);
    const game = new Game(level, newState(new Int16Array([0, 1]), 2));
    expect(game.tapCell(0)).toEqual({ type: 'liegt-richtig', cell: 0 });
  });

  describe('wenn die Auswahl nicht ganz ins Ziel passt', () => {
    /** Vier B liegen oben falsch, frei sind zwei getrennte Löcher für B (unten links eins, unten rechts zwei). */
    function tooMany(): Game {
      const level = levelFromRows(['AAAA', 'BABB']);
      const game = new Game(level, newState(new Int16Array([1, 1, 1, 1, EMPTY, 0, EMPTY, EMPTY]), 6));
      game.state.tray.set([0, 0, 0]);
      return game;
    }

    it('bleibt der Rest gewählt und rollt mit dem nächsten Tipp ins nächste Ziel', () => {
      const game = tooMany();
      expect(game.tapCell(0)).toMatchObject({ type: 'gewählt', hatLoch: true });
      expect(game.selection).toMatchObject({ source: 'board', cells: [0, 1, 2, 3] });

      // das einzelne Loch unten links nimmt nur eine Murmel auf: die nächstgelegene
      const first = game.tapCell(4);
      expect(first).toMatchObject({
        type: 'gerollt',
        ziel: 'bild',
        rest: { source: 'board', color: 1, cells: [1, 2, 3] },
      });
      expect(game.selection).toMatchObject({ source: 'board', color: 1, cells: [1, 2, 3] });
      expect(Array.from(game.state.cur)).toEqual([EMPTY, 1, 1, 1, 1, 0, EMPTY, EMPTY]);

      // ohne neu zu wählen: der Rest rollt in das Loch unten rechts, eine Murmel bleibt übrig und gewählt
      const second = game.tapCell(7);
      expect(second).toMatchObject({ type: 'gerollt', rest: { source: 'board', cells: [1] } });
      expect(Array.from(game.state.cur)).toEqual([EMPTY, 1, EMPTY, EMPTY, 1, 0, 1, 1]);

      // die letzte kommt auf das Holzbrett, danach ist nichts mehr gewählt
      expect(game.tapTray(null)).toMatchObject({ type: 'gerollt', ziel: 'ablage', rest: null });
      expect(game.selection).toBeNull();
    });

    it('lässt sich der Rest abwählen wie jede Auswahl', () => {
      const game = tooMany();
      game.tapCell(0);
      game.tapCell(4);
      expect(game.tapCell(2)).toEqual({ type: 'abgewählt' });
      expect(game.selection).toBeNull();
    });

    it('bleibt auch von Murmeln auf dem Holzbrett der Rest gewählt', () => {
      const level = levelFromRows(['AAB', 'BBA']);
      // frei: ein Loch für A oben links, eins unten rechts; auf dem Holzbrett liegen drei A
      const game = new Game(level, newState(new Int16Array([EMPTY, 1, 1, 0, 0, EMPTY]), 4));
      game.state.tray.set([0, 0, 0]);
      expect(game.tapTray(0)).toMatchObject({ type: 'gewählt' });
      expect(game.tapCell(0)).toMatchObject({ type: 'gerollt', rest: { source: 'tray', color: 0, slots: [1, 2] } });
      expect(game.tapCell(5)).toMatchObject({ type: 'gerollt', rest: { source: 'tray', slots: [2] } });
      expect(trayCount(game.state)).toBe(1);
    });

    it('bleibt gewählt, was nicht mehr auf das volle Holzbrett passt', () => {
      const level = levelFromRows(['AAA', 'BBB']);
      const game = new Game(level, newState(new Int16Array([1, 1, 1, 0, 0, 0]), 2));
      game.tapCell(0);
      expect(game.tapTray(null)).toMatchObject({
        type: 'gerollt',
        ziel: 'ablage',
        rest: { source: 'board', color: 1 },
      });
      expect(game.selection?.source === 'board' && game.selection.cells).toHaveLength(1);
      // ein zweiter Tipp auf das volle Brett wird freundlich abgelehnt, die Auswahl bleibt
      expect(game.tapTray(null)).toEqual({ type: 'abgelehnt', reason: 'ablage-voll' });
      expect(game.selection).not.toBeNull();
    });

    it('ist nach dem Zurücknehmen nichts mehr gewählt', () => {
      const game = tooMany();
      game.tapCell(0);
      game.tapCell(4);
      expect(game.undo()).toBe(true);
      expect(game.selection).toBeNull();
      expect(Array.from(game.state.cur)).toEqual([1, 1, 1, 1, EMPTY, 0, EMPTY, EMPTY]);
    });
  });

  it('nimmt Züge zurück', () => {
    const game = swapped();
    expect(game.canUndo).toBe(false);
    game.tapCell(0);
    game.tapTray(null);
    expect(game.canUndo).toBe(true);
    expect(game.undo()).toBe(true);
    expect(Array.from(game.state.cur)).toEqual([1, 1, 0, 0]);
    expect(trayCount(game.state)).toBe(0);
    expect(game.undo()).toBe(false);
  });

  it('lässt sich nur über Tipps vollständig durchspielen', () => {
    const level = patchLevel(14, 14, 5, 6);
    const game = Game.start(level, makeRng(12), 30);
    for (let step = 0; step < 2000 && !game.solved; step++) {
      game.tapOutside(); // ein Rest vom vorigen Zug ist noch gewählt: erst ablegen, dann neu wählen
      const s = suggest(level, game.state);
      if (!s) throw new Error('kein Zug');
      const first = 'cell' in s.select ? game.tapCell(s.select.cell) : game.tapTray(s.select.slot);
      expect(first.type).toBe('gewählt');
      const second = s.target === 'ablage' ? game.tapTray(null) : game.tapCell(s.target.cell);
      expect(second.type).toBe('gerollt');
    }
    expect(game.solved).toBe(true);
  });
});
