import { newCanvas } from '../art/paint';

/** Ein vorgezeichnetes Bildchen samt Rand für Schatten. */
export interface Sprite {
  readonly canvas: HTMLCanvasElement;
  /** Durchmesser der Figur in CSS-Pixeln */
  readonly d: number;
  /** Kantenlänge inklusive Rand */
  readonly full: number;
}

/**
 * Zwischenspeicher für Murmeln und Mulden: Jede Farbe und Größe wird einmal gezeichnet und danach nur kopiert.
 * Das hält auch große Bilder mit über tausend Murmeln flüssig.
 */
export class Sprites {
  private cache = new Map<string, Sprite>();
  dpr = 1;

  clear(): void {
    this.cache.clear();
  }

  get(key: string, d: number, draw: (x: CanvasRenderingContext2D, d: number) => void): Sprite {
    const size = Math.max(4, Math.round(d));
    const id = `${key}|${size}`;
    let sprite = this.cache.get(id);
    if (!sprite) {
      const pad = Math.ceil(size * 0.4);
      const full = size + 2 * pad;
      const canvas = newCanvas(full * this.dpr, full * this.dpr);
      const x = canvas.getContext('2d') as CanvasRenderingContext2D;
      x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      x.translate(pad, pad);
      draw(x, size);
      sprite = { canvas, d: size, full };
      this.cache.set(id, sprite);
    }
    return sprite;
  }

  /** Zeichnet das Bildchen mit Mittelpunkt (cx, cy) und Durchmesser d. */
  static blit(x: CanvasRenderingContext2D, s: Sprite, cx: number, cy: number, d: number, alpha?: number): void {
    const w = (s.full * d) / s.d;
    if (alpha !== undefined) x.globalAlpha = alpha;
    x.drawImage(s.canvas, cx - w / 2, cy - w / 2, w, w);
    if (alpha !== undefined) x.globalAlpha = 1;
  }
}
