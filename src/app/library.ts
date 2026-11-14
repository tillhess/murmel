import { grainCanvas, newCanvas, paintScene } from '../art/paint';
import { SCENES } from '../art/scenes';
import { type Level, makeLevel } from '../core/level';
import { type PhotoContrast, type PhotoRaster, photoRaster, rasterLevel, sourceColors } from '../core/quantize';
import { type Mood, type Scene, sceneLevel } from '../core/scene';
import { sceneName, t } from './i18n';
import { store } from './storage';

/** Ein spielbares Bild: das Raster für die Murmeln und das fertig gemalte Bild dazu. */
export interface Picture {
  readonly id: string;
  /** der Name in der Sprache, die gerade gilt */
  readonly name: string;
  readonly level: Level;
  /** Das fertig gemalte Bild in hoher Auflösung. Es entsteht erst, wenn das Bild geöffnet wird. */
  readonly painting: HTMLCanvasElement;
  /** Dasselbe Bild klein, für die Sammlung */
  readonly thumb: HTMLCanvasElement;
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

/** Kantenlänge der kleinen Bilder für die Sammlung */
const THUMB_PX = 480;
/** So viele große Gemälde bleiben im Speicher. Jedes belegt rund acht Megabyte; ein iPad gibt dafür nicht beliebig viel her. */
const KEEP_PAINTINGS = 2;

const paintings = new Map<string, HTMLCanvasElement>();
const thumbs = new Map<string, HTMLCanvasElement>();
const cache = new Map<string, Picture>();

/** Das große Gemälde einer Szene. Gemalt wird beim ersten Öffnen; die zuletzt gebrauchten bleiben liegen. */
function paintingOf(scene: Scene): HTMLCanvasElement {
  let painting = paintings.get(scene.id);
  if (painting) paintings.delete(scene.id);
  else painting = paintScene(scene, PAINT_PX);
  paintings.set(scene.id, painting); // zuletzt gebraucht steht hinten
  const sceneIds = SCENES.map((s) => s.id);
  const held = [...paintings.keys()].filter((id) => sceneIds.includes(id));
  for (const id of held.slice(0, Math.max(0, held.length - KEEP_PAINTINGS))) paintings.delete(id);
  return painting;
}

function thumbOf(scene: Scene): HTMLCanvasElement {
  let thumb = thumbs.get(scene.id);
  if (!thumb) {
    thumb = paintScene(scene, THUMB_PX);
    thumbs.set(scene.id, thumb);
  }
  return thumb;
}

function fromScene(scene: Scene, size: number | null = null): Picture {
  const n = size ?? scene.size;
  const key = n === scene.size ? scene.id : `${scene.id}@${n}`;
  let picture = cache.get(key);
  if (!picture) {
    picture = {
      id: scene.id,
      get name() {
        return sceneName(scene.id, scene.name);
      },
      level: sceneLevel(scene, n),
      get painting() {
        return paintingOf(scene);
      },
      get thumb() {
        return thumbOf(scene);
      },
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

/** Wie stark sich die Murmelfarben eigener Fotos unterscheiden sollen, siehe Einstellungen */
let contrast: PhotoContrast = store.contrast;
export function setPhotoContrast(next: PhotoContrast): void {
  contrast = next;
}

const rasters = new Map<string, PhotoRaster>();

/**
 * Das Raster eines eigenen Fotos in einer Detailtiefe. Es wird beim ersten Mal aus dem Foto gerechnet und dann
 * aufbewahrt: Ein Spielstand passt nur zu genau dem Raster, mit dem er begonnen wurde.
 */
function rasterOf(id: string, photo: HTMLCanvasElement, cells: number): PhotoRaster | null {
  const key = `${id}@${cells}`;
  const known = rasters.get(key);
  if (known) return known;
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
  const data = gx.getImageData(0, 0, cells, cells).data;

  const saved = store.own().find((r) => r.id === id)?.levels[String(cells)];
  let raster: PhotoRaster | null = null;
  if (saved && saved.target.length === cells * cells) {
    // Stände von früher kennen die Fotofarben nicht: Sie lassen sich aus dem Foto nachlesen.
    const source = saved.source ?? sourceColors(data, saved.target, saved.palette.length);
    raster = { source, target: Int16Array.from(saved.target) };
    if (!saved.source) store.setOwnLevel(id, cells, { ...saved, source });
  } else {
    raster = photoRaster(data, cells, cells, PHOTO_COLORS);
    if (raster) {
      const palette = [...rasterLevel('', cells, cells, raster, 'naturnah').palette];
      store.setOwnLevel(id, cells, { palette, source: raster.source, target: Array.from(raster.target) });
    }
  }
  if (raster) rasters.set(key, raster);
  return raster;
}

/** Das Raster mit Murmelfarben im eingestellten Abstand. Die Felder bleiben dieselben, nur die Farben wechseln. */
function levelOf(id: string, photo: HTMLCanvasElement, cells: number): Level | null {
  const key = `${id}@${cells}/${contrast}`;
  const known = ownLevels.get(key);
  if (known) return known;
  const raster = rasterOf(id, photo, cells);
  if (!raster) return null;
  // "naturnah" bleibt bei den Farben, mit denen das Bild entstanden ist
  const saved = store.own().find((r) => r.id === id)?.levels[String(cells)];
  const level =
    contrast === 'naturnah' && saved
      ? makeLevel(id, cells, cells, saved.palette, raster.target)
      : rasterLevel(id, cells, cells, raster, contrast);
  ownLevels.set(key, level);
  return level;
}

/** Wie ein eigenes Bild in der Sammlung heißt: das erste schlicht "Eigenes Bild", weitere mit Nummer. */
const ownName = (index: number): string => (index === 0 ? t('own_name') : t('own_name_n', { n: index + 1 }));

function ownPicture(id: string, index: number, photo: HTMLCanvasElement, size: number | null): Picture | null {
  const cells = size ?? PHOTO_CELLS;
  const level = levelOf(id, photo, cells);
  if (!level) return null;
  const picture: Picture = {
    id,
    get name() {
      return ownName(index);
    },
    level,
    get painting() {
      return printOf(id, photo);
    },
    thumb: photo,
    mood: DEFAULT_MOOD,
    own: true,
    key: cells === PHOTO_CELLS ? id : `${id}@${cells}`,
    // lässt sich das Foto in der neuen Größe nicht umsetzen, bleibt es, wie es ist
    atSize: (other) => ownPicture(id, index, photo, other) ?? picture,
  };
  return picture;
}

/** Die eigenen Bilder der Sammlung, in der Reihenfolge, in der sie dazukamen. */
export function ownPictures(detail: number | null = null): Picture[] {
  const out: Picture[] = [];
  store.own().forEach((record, index) => {
    const photo = photos.get(record.id);
    const picture = photo ? ownPicture(record.id, index, photo, detail) : null;
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
  const picture = ownPicture(id, index, photo, detail);
  if (!picture) removeOwn(id);
  return picture;
}

/** Entfernt ein eigenes Bild aus der Sammlung, samt Foto und Spielständen. */
export function removeOwn(id: string): void {
  store.removeOwn(id);
  photos.delete(id);
  paintings.delete(id);
  for (const map of [ownLevels, rasters])
    for (const key of [...map.keys()]) if (key.startsWith(`${id}@`)) map.delete(key);
}
