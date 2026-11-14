import { describe, expect, it } from 'vitest';
import { colorShares, inShape, rasterize, type Scene, sceneLevel } from './scene';

const mood = { top: '#000000', bottom: '#000000', ink: '#ffffff', root: 57 };

describe('Motiv als Raster', () => {
  it('erkennt Punkte in Vielecken und gedrehten Ellipsen', () => {
    const tri = {
      kind: 'poly',
      pts: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
    } as const;
    expect(inShape(tri, 0.2, 0.2)).toBe(true);
    expect(inShape(tri, 0.8, 0.8)).toBe(false);
    const flat = { kind: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.1 } as const;
    expect(inShape(flat, 0.85, 0.5)).toBe(true);
    expect(inShape(flat, 0.5, 0.75)).toBe(false);
    const upright = { ...flat, rot: Math.PI / 2 };
    expect(inShape(upright, 0.5, 0.85)).toBe(true);
    expect(inShape(upright, 0.85, 0.5)).toBe(false);
    expect(inShape('full', 0.99, 0.01)).toBe(true);
  });

  it('gibt jedem Feld die Farbe der obersten Lage mit der größten Fläche', () => {
    const scene: Scene = {
      id: 't',
      name: 'Test',
      size: 4,
      palette: ['#101010', '#f0f0f0', '#d02020'],
      mood,
      layers: [
        { color: 0, shape: 'full' },
        {
          color: 1,
          shape: {
            kind: 'poly',
            pts: [
              [0, 0.5],
              [1, 0.5],
              [1, 1],
              [0, 1],
            ],
          },
        },
        { color: 2, shape: { kind: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.26, ry: 0.26 } },
      ],
    };
    const t = Array.from(rasterize(scene));
    // prettier-ignore
    expect(t).toEqual([0, 0, 0, 0, 0, 2, 2, 0, 1, 2, 2, 1, 1, 1, 1, 1]);
    const level = sceneLevel(scene);
    expect(level.cells.length).toBe(16);
    expect(colorShares(level)).toEqual([6 / 16, 6 / 16, 4 / 16]);
  });

  it('lässt Felder ohne Lage aus dem Bild heraus', () => {
    const scene: Scene = {
      id: 't2',
      name: 'Insel',
      size: 4,
      palette: ['#d02020'],
      mood,
      layers: [
        {
          color: 0,
          shape: {
            kind: 'poly',
            pts: [
              [0, 0],
              [0.5, 0],
              [0.5, 0.5],
              [0, 0.5],
            ],
          },
        },
      ],
    };
    const level = sceneLevel(scene);
    expect(level.cells).toEqual([0, 1, 4, 5]);
    expect(level.target[15]).toBe(-1);
  });
});
