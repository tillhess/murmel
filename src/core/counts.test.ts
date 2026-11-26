import { expect, it } from 'vitest';
import { openCounts } from './counts';
import { makeLevel } from './level';

const level = makeLevel('Test', 3, 2, ['#000000', '#ffffff', '#ff0000'], new Int16Array([0, 0, 1, 1, 2, -1]));
it('zählt freie und falsch belegte Ziele, unabhängig vom Ablageort der Murmeln', () => {
  expect(openCounts(level, new Int16Array([1, 0, -1, 2, 0, -1]))).toEqual([1, 2, 1]);
});
it('zählt jede rollende Murmel bis zur sichtbaren Ankunft weiter', () => {
  const cur = level.target.slice();
  const arriving = new Set([0, 1, 4]);
  expect(openCounts(level, cur, arriving)).toEqual([2, 0, 1]);
  arriving.delete(0);
  expect(openCounts(level, cur, arriving)).toEqual([1, 0, 1]);
});
it('behält abgeschlossene Farben mit null und folgt einem zurückgenommenen Zug', () => {
  const cur = level.target.slice();
  expect(openCounts(level, cur)).toEqual([0, 0, 0]);
  cur[4] = -1;
  expect(openCounts(level, cur)).toEqual([0, 0, 1]);
});
