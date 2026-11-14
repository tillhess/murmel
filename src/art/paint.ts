import { rgba } from '../core/color';
import { makeRng } from '../core/random';
import type { Layer, Scene, Shape } from '../core/scene';

/** Zeichnet eine Form als Pfad in Pixeln (Bildkante = px). */
export function shapePath(shape: Shape | 'full', px: number): Path2D {
  const path = new Path2D();
  if (shape === 'full') {
    path.rect(0, 0, px, px);
  } else if (shape.kind === 'ellipse') {
    path.ellipse(shape.cx * px, shape.cy * px, shape.rx * px, shape.ry * px, shape.rot ?? 0, 0, Math.PI * 2);
  } else {
    shape.pts.forEach(([x, y], k) => {
      if (k === 0) path.moveTo(x * px, y * px);
      else path.lineTo(x * px, y * px);
    });
    path.closePath();
  }
  return path;
}

export function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

let grain: HTMLCanvasElement | null = null;
/** Papierkorn: feines Rauschen mit einzelnen Fasern. Einmal erzeugt, dann als Muster wiederverwendet. */
export function grainCanvas(): HTMLCanvasElement {
  if (grain) return grain;
  const size = 256;
  grain = newCanvas(size, size);
  const x = grain.getContext('2d') as CanvasRenderingContext2D;
  const img = x.createImageData(size, size);
  const rng = makeRng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + rng() * 28 + (rng() < 0.04 ? rng() * 40 - 20 : 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // Fasern: kurze, helle und dunkle Striche
  x.lineCap = 'round';
  for (let k = 0; k < 220; k++) {
    const px = rng() * size;
    const py = rng() * size;
    const a = rng() * Math.PI;
    const len = 3 + rng() * 9;
    x.strokeStyle = rng() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
    x.lineWidth = 0.5 + rng() * 0.5;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
    x.stroke();
  }
  return grain;
}

function paintLayer(x: CanvasRenderingContext2D, scene: Scene, layer: Layer, px: number): void {
  const path = shapePath(layer.shape, px);
  const color = layer.ink ?? scene.palette[layer.color];
  const lift = layer.lift ?? 0;
  x.save();
  if (lift > 0) {
    // Die Lage schwebt über dem Untergrund und wirft einen weichen Schatten nach unten rechts.
    x.shadowColor = `rgba(16,18,36,${0.16 + 0.2 * lift})`;
    x.shadowBlur = px * 0.022 * lift;
    x.shadowOffsetX = px * 0.005 * lift;
    x.shadowOffsetY = px * 0.012 * lift;
  }
  x.fillStyle = color;
  x.fill(path);
  x.restore();

  x.save();
  x.clip(path);
  if (layer.shade) {
    // weicher Verlauf innerhalb der Lage
    const a = (layer.shade.angle * Math.PI) / 180;
    const dx = (Math.cos(a) * px) / 2;
    const dy = (Math.sin(a) * px) / 2;
    const g = x.createLinearGradient(px / 2 - dx, px / 2 - dy, px / 2 + dx, px / 2 + dy);
    const amount = layer.shade.amount;
    const dark = rgba('#0c1024', Math.abs(amount) * 0.55);
    const light = rgba('#fff6e2', Math.abs(amount) * 0.5);
    g.addColorStop(0, amount >= 0 ? dark : light);
    g.addColorStop(0.5, 'rgba(0,0,0,0)');
    g.addColorStop(1, amount >= 0 ? light : dark);
    x.fillStyle = g;
    x.fillRect(0, 0, px, px);
  }
  if (lift > 0) {
    // Schnittkante: oben links fängt das Papier etwas Licht
    x.strokeStyle = 'rgba(255,250,235,0.22)';
    x.lineWidth = px * 0.006;
    x.translate(px * 0.002, px * 0.003);
    x.stroke(path);
  }
  x.restore();
}

/** Malt das Motiv als Papierschnitt: flache Farblagen mit weichen Schatten, Verläufen und Papierkorn. */
export function paintScene(scene: Scene, px: number): HTMLCanvasElement {
  const canvas = newCanvas(px, px);
  const x = canvas.getContext('2d') as CanvasRenderingContext2D;
  for (const layer of scene.layers) paintLayer(x, scene, layer, px);
  // Licht von oben links über das ganze Blatt
  const light = x.createRadialGradient(px * 0.2, px * 0.12, 0, px * 0.2, px * 0.12, px * 1.1);
  light.addColorStop(0, 'rgba(255,246,224,0.16)');
  light.addColorStop(0.6, 'rgba(255,246,224,0)');
  light.addColorStop(1, 'rgba(10,12,30,0.14)');
  x.fillStyle = light;
  x.fillRect(0, 0, px, px);
  // Papierkorn
  x.save();
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = 0.55;
  x.fillStyle = x.createPattern(grainCanvas(), 'repeat') as CanvasPattern;
  x.fillRect(0, 0, px, px);
  x.restore();
  return canvas;
}
