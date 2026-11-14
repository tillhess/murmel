import { grainCanvas, newCanvas, paintScene } from '../art/paint';
import { SCENES } from '../art/scenes';
import type { Level } from '../core/level';
import { photoLevel } from '../core/quantize';
import { type Mood, type Scene, sceneLevel } from '../core/scene';

/** Ein spielbares Bild: das Raster für die Murmeln und das fertig gemalte Bild dazu. */
export interface Picture {
  readonly id: string;
  readonly name: string;
  readonly level: Level;
  readonly painting: HTMLCanvasElement;
  readonly mood: Mood;
  /** eigene Fotos werden nicht gespeichert */
  readonly own: boolean;
}

/** Stimmung der Startseite und eigener Fotos: tiefes Abendblau */
export const DEFAULT_MOOD: Mood = { top: '#1a2452', bottom: '#56508f', ink: '#f3ecd8', root: 50 };

const PAINT_PX = 960;
const cache = new Map<string, Picture>();

function fromScene(scene: Scene): Picture {
  let picture = cache.get(scene.id);
  if (!picture) {
    picture = {
      id: scene.id,
      name: scene.name,
      level: sceneLevel(scene),
      painting: paintScene(scene, PAINT_PX),
      mood: scene.mood,
      own: false,
    };
    cache.set(scene.id, picture);
  }
  return picture;
}

/** Alle mitgelieferten Bilder, vom kleinsten zum größten. */
export const pictures = (): Picture[] => SCENES.map(fromScene);

/**
 * Macht aus einem Foto ein Bild zum Spielen: verkleinert, auf wenige klar unterscheidbare Murmelfarben reduziert,
 * und als Druck mit Papierkorn aufbereitet. Das Foto bleibt auf dem Gerät.
 */
export function fromPhoto(image: HTMLImageElement | HTMLCanvasElement, cells = 24, colors = 7): Picture | null {
  const side = Math.min(image.width, image.height);
  if (!side) return null;
  // quadratischer Ausschnitt aus der Mitte
  const sx = (image.width - side) / 2;
  const sy = (image.height - side) / 2;
  const painting = newCanvas(PAINT_PX, PAINT_PX);
  const x = painting.getContext('2d') as CanvasRenderingContext2D;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(image, sx, sy, side, side, 0, 0, PAINT_PX, PAINT_PX);

  // schrittweise halbieren: so mittelt der Browser sauber, statt Bildpunkte zu überspringen
  let small: HTMLCanvasElement = painting;
  while (small.width / 2 >= cells * 1.5) {
    const next = newCanvas(small.width / 2, small.height / 2);
    const nx = next.getContext('2d') as CanvasRenderingContext2D;
    nx.imageSmoothingQuality = 'high';
    nx.drawImage(small, 0, 0, next.width, next.height);
    small = next;
  }
  const grid = newCanvas(cells, cells);
  const gx = grid.getContext('2d') as CanvasRenderingContext2D;
  gx.imageSmoothingQuality = 'high';
  gx.drawImage(small, 0, 0, cells, cells);
  const level = photoLevel('Eigenes Bild', gx.getImageData(0, 0, cells, cells).data, cells, cells, colors);
  if (!level) return null;

  // wie ein Druck: weiches Licht und Papierkorn über dem Foto
  const light = x.createRadialGradient(
    PAINT_PX * 0.2,
    PAINT_PX * 0.12,
    0,
    PAINT_PX * 0.2,
    PAINT_PX * 0.12,
    PAINT_PX * 1.1,
  );
  light.addColorStop(0, 'rgba(255,246,224,0.14)');
  light.addColorStop(0.6, 'rgba(255,246,224,0)');
  light.addColorStop(1, 'rgba(10,12,30,0.16)');
  x.fillStyle = light;
  x.fillRect(0, 0, PAINT_PX, PAINT_PX);
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = 0.5;
  x.fillStyle = x.createPattern(grainCanvas(), 'repeat') as CanvasPattern;
  x.fillRect(0, 0, PAINT_PX, PAINT_PX);
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;

  return { id: 'eigenes', name: 'Eigenes Bild', level, painting, mood: DEFAULT_MOOD, own: true };
}
