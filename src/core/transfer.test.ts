import { describe, expect, it } from 'vitest';
import { type PictureFrame, transferPose } from './transfer';

const frame: PictureFrame = { x: 100, y: 100, w: 400, h: 440, rim: 8 };

describe('Rollen über den Holzrahmen', () => {
  it('bleibt im Bild am Boden und behält dort seine Größe', () => {
    for (const p of [0, 0.1, 0.4, 0.65]) {
      const pose = transferPose([200, 300], [600, 300], p, frame, 24, 36);
      expect(pose.height).toBe(0);
      expect(pose.size).toBe(24);
      expect(pose.x).toBe(200 + 400 * p);
      expect(pose.y).toBe(300);
    }
  });

  it.each([
    { name: 'seitlichen', board: [200, 300] as const, tray: [600, 300] as const, edge: 0.74 },
    { name: 'unteren', board: [300, 240] as const, tray: [300, 640] as const, edge: 0.74 },
    { name: 'schräg erreichten', board: [300, 300] as const, tray: [600, 620] as const, edge: 0.65 },
  ])('hüpft nur am $name Rahmen und landet wieder', ({ board, tray, edge }) => {
    expect(transferPose(board, tray, edge, frame, 24, 36).height).toBeGreaterThan(0);
    expect(transferPose(board, tray, 0.2, frame, 24, 36).height).toBe(0);
    const end = transferPose(board, tray, 1, frame, 24, 36);
    expect(end).toEqual({ x: tray[0], y: tray[1], size: 36, height: 0 });
  });

  it('funktioniert auf demselben Weg zurück und auch mit vergrößerten Murmeln', () => {
    const samples = Array.from({ length: 101 }, (_, i) => transferPose([490, 320], [600, 360], i / 100, frame, 80, 24));
    expect(samples[0]).toEqual({ x: 490, y: 320, size: 80, height: 0 });
    expect(samples[100]).toEqual({ x: 600, y: 360, size: 24, height: 0 });
    expect(samples.some((p) => p.height > 0)).toBe(true);
    for (const p of samples) {
      expect(p.size).toBeGreaterThanOrEqual(24);
      expect(p.size).toBeLessThanOrEqual(80);
      expect(p.height).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(p.x + p.y + p.height)).toBe(true);
    }
  });

  it('bleibt bei einem Weg ohne Länge ruhig', () => {
    expect(transferPose([300, 300], [300, 300], 0.5, frame, 24, 36)).toEqual({ x: 300, y: 300, size: 24, height: 0 });
  });
});
