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
