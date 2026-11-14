/**
 * Der Ausschnitt des Bildes, den man gerade sieht: wie stark es vergrößert ist und wohin es verschoben wurde.
 * Reine Rechnung. Alle Maße sind Bildschirmpunkte relativ zur linken oberen Ecke des Bildrahmens.
 *
 * Ein Punkt (px, py) des unvergrößerten Bildes erscheint bei (px * zoom - x, py * zoom - y).
 * Der Rahmen selbst bleibt, wo er ist; das Holzbrett daneben wird nie vergrößert.
 */
export interface Camera {
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
}

/** Größe des Bildrahmens, also des unvergrößerten Bildes */
export interface Frame {
  readonly w: number;
  readonly h: number;
}

/** Das ganze Bild, unvergrößert */
export const WHOLE: Camera = { zoom: 1, x: 0, y: 0 };

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Hält den Ausschnitt im Bild: nie kleiner als das Ganze, nie über den Rand hinaus verschoben. */
export function clampCamera(cam: Camera, frame: Frame, maxZoom: number): Camera {
  const zoom = clamp(cam.zoom, 1, Math.max(1, maxZoom));
  return { zoom, x: clamp(cam.x, 0, frame.w * (zoom - 1)), y: clamp(cam.y, 0, frame.h * (zoom - 1)) };
}

/** Wo ein Punkt des unvergrößerten Bildes im Rahmen erscheint. */
export const toScreen = (cam: Camera, px: number, py: number): [number, number] => [
  px * cam.zoom - cam.x,
  py * cam.zoom - cam.y,
];

/** Welcher Punkt des unvergrößerten Bildes unter einer Stelle im Rahmen liegt. */
export const toPicture = (cam: Camera, sx: number, sy: number): [number, number] => [
  (sx + cam.x) / cam.zoom,
  (sy + cam.y) / cam.zoom,
];

/**
 * Vergrößert oder verkleinert um den Faktor `factor`. Der Punkt unter (sx, sy) bleibt dabei an seiner Stelle,
 * so wie das Bild unter zwei Fingern liegen bleibt.
 */
export function zoomAt(cam: Camera, factor: number, sx: number, sy: number, frame: Frame, maxZoom: number): Camera {
  const zoom = clamp(cam.zoom * factor, 1, Math.max(1, maxZoom));
  const [px, py] = toPicture(cam, sx, sy);
  return clampCamera({ zoom, x: px * zoom - sx, y: py * zoom - sy }, frame, maxZoom);
}

/**
 * Zwei Finger: Ihr Mittelpunkt wandert von (fromX, fromY) nach (toX, toY), ihr Abstand wächst um `factor`.
 * Der Punkt des Bildes, der unter dem alten Mittelpunkt lag, liegt danach unter dem neuen. Verschieben und
 * Vergrößern in einem Schritt: Nacheinander ausgeführt, würde das Bild unter den Fingern wegrutschen.
 */
export function pinchTo(
  cam: Camera,
  factor: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  frame: Frame,
  maxZoom: number,
): Camera {
  const zoom = clamp(cam.zoom * factor, 1, Math.max(1, maxZoom));
  const [px, py] = toPicture(cam, fromX, fromY);
  return clampCamera({ zoom, x: px * zoom - toX, y: py * zoom - toY }, frame, maxZoom);
}

/** Verschiebt das Bild um (dx, dy) Bildschirmpunkte, so als zöge man es mit dem Finger. */
export function panBy(cam: Camera, dx: number, dy: number, frame: Frame, maxZoom: number): Camera {
  return clampCamera({ zoom: cam.zoom, x: cam.x - dx, y: cam.y - dy }, frame, maxZoom);
}

/** Welcher Teil des unvergrößerten Bildes gerade im Rahmen zu sehen ist. */
export function visible(cam: Camera, frame: Frame): { x: number; y: number; w: number; h: number } {
  return { x: cam.x / cam.zoom, y: cam.y / cam.zoom, w: frame.w / cam.zoom, h: frame.h / cam.zoom };
}
