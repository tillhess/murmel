import { grainCanvas, newCanvas, paintScene } from '../art/paint';
import { SCENES } from '../art/scenes';
import { type Level, makeLevel } from '../core/level';
import { photoLevel } from '../core/quantize';
import { type Mood, type Scene, sceneLevel } from '../core/scene';
import { store } from './storage';

/** Ein spielbares Bild: das Raster für die Murmeln und das fertig gemalte Bild dazu. */
export interface Picture {
  readonly id: string;
  readonly name: string;
  readonly level: Level;
  readonly painting: HTMLCanvasElement;
  readonly mood: Mood;
  /** ein eigenes Foto: lässt sich aus der Sammlung entfernen */
  readonly own: boolean;
  /**
   * Unter diesem Namen liegen Spielstand und Fertig-Vermerk. Jede Detailtiefe eines Bildes hat ihren eigenen
   * Stand; in der Größe, für die es gemalt wurde, ist es schlicht die Kennung des Bildes.
   */
  readonly key: string;
  /** Dasselbe Bild in anderer Detailtiefe (Kantenlänge des Rasters); null heißt: so, wie es gemalt wurde. */
  atSize(size: number | null): Picture;
}

/** Stimmung der Startseite und eigener Fotos: tiefes Abendblau */
export const DEFAULT_MOOD: Mood = { top: '#1a2452', bottom: '#56508f', ink: '#f3ecd8', root: 50 };

/** Kantenlänge der gemalten Bilder in Bildpunkten: genug, um auch hineingezoomt noch klar zu sein */
const PAINT_PX = 1440;
/** Ein eigenes Foto bekommt ohne andere Angabe so viele Felder je Kante und höchstens so viele Farben */
const PHOTO_CELLS = 24;
const PHOTO_COLORS = 7;
/** So groß (Kantenlänge in Bildpunkten) wird ein eigenes Foto aufbewahrt */
const PHOTO_PX = 800;

const paintings = new Map<string, HTMLCanvasElement>();
const cache = new Map<string, Picture>();

function fromScene(scene: Scene, size: number | null = null): Picture {
  const n = size ?? scene.size;
  const key = n === scene.size ? scene.id : `${scene.id}@${n}`;
  let picture = cache.get(key);
  if (!picture) {
    let painting = paintings.get(scene.id);
    if (!painting) {
      painting = paintScene(scene, PAINT_PX);
      paintings.set(scene.id, painting);
    }
    picture = {
      id: scene.id,
      name: scene.name,
      level: sceneLevel(scene, n),
      painting,
      mood: scene.mood,
      own: false,
      key,
      atSize: (other) => fromScene(scene, other),
    };
    cache.set(key, picture);
  }
  return picture;
}

/** Alle mitgelieferten Bilder, vom kleinsten zum größten. `detail` legt für alle dieselbe Kantenlänge fest. */
export const pictures = (detail: number | null = null): Picture[] => SCENES.map((scene) => fromScene(scene, detail));

// ---------- eigene Fotos ----------

/** Die zugeschnittenen Fotos, nach Kennung. Sie werden beim Start aus dem Speicher geholt (siehe loadOwn). */
const photos = new Map<string, HTMLCanvasElement>();
const ownLevels = new Map<string, Level>();

/** Wie ein Druck: weiches Licht und Papierkorn über dem Foto. */
function printOf(id: string, photo: HTMLCanvasElement): HTMLCanvasElement {
  let painting = paintings.get(id);
  if (painting) return painting;
  painting = newCanvas(PAINT_PX, PAINT_PX);
  const x = painting.getContext('2d') as CanvasRenderingContext2D;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(photo, 0, 0, PAINT_PX, PAINT_PX);
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
  paintings.set(id, painting);
  return painting;
}

/**
 * Das Raster eines eigenen Fotos in einer Detailtiefe. Es wird beim ersten Mal aus dem Foto gerechnet und dann
 * aufbewahrt: Ein Spielstand passt nur zu genau dem Raster, mit dem er begonnen wurde.
 */
function levelOf(id: string, name: string, photo: HTMLCanvasElement, cells: number): Level | null {
  const key = `${id}@${cells}`;
  const known = ownLevels.get(key);
  if (known) return known;
  const saved = store.own().find((r) => r.id === id)?.levels[String(cells)];
  let level: Level | null = null;
  if (saved && saved.target.length === cells * cells) {
    level = makeLevel(name, cells, cells, saved.palette, Int16Array.from(saved.target));
  } else {
    // schrittweise halbieren: so mittelt der Browser sauber, statt Bildpunkte zu überspringen
    let small: HTMLCanvasElement = photo;
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
    level = photoLevel(name, gx.getImageData(0, 0, cells, cells).data, cells, cells, PHOTO_COLORS);
    if (level) store.setOwnLevel(id, cells, { palette: [...level.palette], target: Array.from(level.target) });
  }
  if (level) ownLevels.set(key, level);
  return level;
}

function ownPicture(id: string, name: string, photo: HTMLCanvasElement, size: number | null): Picture | null {
  const cells = size ?? PHOTO_CELLS;
  const level = levelOf(id, name, photo, cells);
  if (!level) return null;
  const picture: Picture = {
    id,
    name,
    level,
    painting: printOf(id, photo),
    mood: DEFAULT_MOOD,
    own: true,
    key: cells === PHOTO_CELLS ? id : `${id}@${cells}`,
    // lässt sich das Foto in der neuen Größe nicht umsetzen, bleibt es, wie es ist
    atSize: (other) => ownPicture(id, name, photo, other) ?? picture,
  };
  return picture;
}

/** Wie ein eigenes Bild in der Sammlung heißt: das erste schlicht "Eigenes Bild", weitere mit Nummer. */
const ownName = (index: number): string => (index === 0 ? 'Eigenes Bild' : `Eigenes Bild ${index + 1}`);

/** Die eigenen Bilder der Sammlung, in der Reihenfolge, in der sie dazukamen. */
export function ownPictures(detail: number | null = null): Picture[] {
  const out: Picture[] = [];
  store.own().forEach((record, index) => {
    const photo = photos.get(record.id);
    const picture = photo ? ownPicture(record.id, ownName(index), photo, detail) : null;
    if (picture) out.push(picture);
  });
  return out;
}

/**
 * Holt die aufbewahrten Fotos aus dem Speicher. Das dauert einen Augenblick, weil der Browser die Bilder erst
 * entpacken muss; danach kennt `ownPictures` sie.
 */
export async function loadOwn(): Promise<void> {
  await Promise.all(
    store.own().map(async (record) => {
      const source = store.ownImage(record.id);
      if (!source || photos.has(record.id)) return;
      const image = new Image();
      image.src = source;
      try {
        await image.decode();
      } catch {
        return; // beschädigt oder nicht mehr da: Das Bild fehlt dann in der Sammlung
      }
      const photo = newCanvas(image.width, image.height);
      (photo.getContext('2d') as CanvasRenderingContext2D).drawImage(image, 0, 0);
      photos.set(record.id, photo);
    }),
  );
}

/**
 * Nimmt ein Foto in die Sammlung auf: quadratisch aus der Mitte geschnitten, verkleinert, auf wenige klar
 * unterscheidbare Murmelfarben reduziert. Foto, Raster und Spielstand bleiben auf dem Gerät.
 */
export function addOwn(image: HTMLImageElement | HTMLCanvasElement, detail: number | null = null): Picture | null {
  const side = Math.min(image.width, image.height);
  if (!side) return null;
  const photo = newCanvas(PHOTO_PX, PHOTO_PX);
  const x = photo.getContext('2d') as CanvasRenderingContext2D;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, PHOTO_PX, PHOTO_PX);

  const id = `eigenes-${Date.now().toString(36)}`;
  const index = store.own().length;
  // erst prüfen, ob sich das Foto überhaupt umsetzen lässt, dann aufnehmen
  photos.set(id, photo);
  let stored: string;
  try {
    stored = photo.toDataURL('image/jpeg', 0.86);
  } catch {
    photos.delete(id);
    return null;
  }
  store.addOwn(id, stored);
  const picture = ownPicture(id, ownName(index), photo, detail);
  if (!picture) removeOwn(id);
  return picture;
}

/** Entfernt ein eigenes Bild aus der Sammlung, samt Foto und Spielständen. */
export function removeOwn(id: string): void {
  store.removeOwn(id);
  photos.delete(id);
  paintings.delete(id);
  for (const key of [...ownLevels.keys()]) if (key.startsWith(`${id}@`)) ownLevels.delete(key);
}
