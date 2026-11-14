import { describe, expect, it } from 'vitest';
import { clampCamera, panBy, pinchTo, toPicture, toScreen, visible, WHOLE, zoomAt } from './camera';

const frame = { w: 400, h: 400 };

describe('Bildausschnitt', () => {
  it('zeigt unvergrößert das ganze Bild an seinem Platz', () => {
    expect(toScreen(WHOLE, 120, 80)).toEqual([120, 80]);
    expect(toPicture(WHOLE, 120, 80)).toEqual([120, 80]);
    expect(visible(WHOLE, frame)).toEqual({ x: 0, y: 0, w: 400, h: 400 });
  });

  it('rechnet zwischen Bild und Rahmen hin und zurück', () => {
    const cam = { zoom: 2.5, x: 130, y: 60 };
    const [sx, sy] = toScreen(cam, 100, 100);
    const [px, py] = toPicture(cam, sx, sy);
    expect(px).toBeCloseTo(100);
    expect(py).toBeCloseTo(100);
  });

  it('lässt beim Vergrößern den Punkt unter den Fingern liegen', () => {
    const before = { zoom: 1.5, x: 40, y: 90 };
    const under = toPicture(before, 250, 140);
    const after = zoomAt(before, 1.6, 250, 140, frame, 5);
    expect(after.zoom).toBeCloseTo(2.4);
    const now = toPicture(after, 250, 140);
    expect(now[0]).toBeCloseTo(under[0]);
    expect(now[1]).toBeCloseTo(under[1]);
  });

  it('nimmt das Bild unter zwei Fingern mit, auch wenn sie sich nacheinander bewegen', () => {
    // Der Mittelpunkt der Finger wandert und kehrt zurück, während sie sich spreizen: wie auf einem echten Gerät,
    // das die Finger einzeln meldet. Am Ende liegt derselbe Bildpunkt wieder unter dem Mittelpunkt.
    const under = toPicture(WHOLE, 200, 200);
    let cam = WHOLE;
    let center = 200;
    for (const next of [195, 200, 196, 200, 197, 200]) {
      cam = pinchTo(cam, 1.2, center, 200, next, 200, frame, 6);
      center = next;
    }
    expect(cam.zoom).toBeCloseTo(1.2 ** 6);
    const now = toPicture(cam, 200, 200);
    expect(now[0]).toBeCloseTo(under[0]);
    expect(now[1]).toBeCloseTo(under[1]);
  });

  it('verschiebt mit zwei Fingern auch ohne Vergrößern', () => {
    const cam = pinchTo({ zoom: 2, x: 100, y: 100 }, 1, 150, 150, 180, 140, frame, 4);
    expect(cam).toEqual({ zoom: 2, x: 70, y: 110 });
  });

  it('vergrößert höchstens bis zur Grenze und verkleinert nie unter das ganze Bild', () => {
    expect(zoomAt(WHOLE, 10, 200, 200, frame, 3).zoom).toBe(3);
    const out = zoomAt({ zoom: 2, x: 150, y: 150 }, 0.1, 200, 200, frame, 3);
    expect(out).toEqual(WHOLE);
  });

  it('verschiebt das Bild mit dem Finger, aber nie über seinen Rand hinaus', () => {
    const cam = { zoom: 2, x: 100, y: 100 };
    expect(panBy(cam, -30, 20, frame, 3)).toEqual({ zoom: 2, x: 130, y: 80 });
    expect(panBy(cam, 500, 500, frame, 3)).toEqual({ zoom: 2, x: 0, y: 0 });
    expect(panBy(cam, -500, -500, frame, 3)).toEqual({ zoom: 2, x: 400, y: 400 });
    // unvergrößert gibt es nichts zu verschieben
    expect(panBy(WHOLE, 40, 40, frame, 3)).toEqual(WHOLE);
  });

  it('hält einen Ausschnitt im Bild, wenn der Rahmen kleiner wird', () => {
    expect(clampCamera({ zoom: 3, x: 900, y: 10 }, { w: 300, h: 300 }, 4)).toEqual({ zoom: 3, x: 600, y: 10 });
    expect(clampCamera({ zoom: 6, x: 0, y: 0 }, frame, 2).zoom).toBe(2);
  });

  it('nennt den sichtbaren Teil des Bildes', () => {
    expect(visible({ zoom: 2, x: 100, y: 300 }, frame)).toEqual({ x: 50, y: 150, w: 200, h: 200 });
  });
});
