import { HOLE_STYLES, type HoleStyle } from '../art/holes';
import { MARBLE_STYLES, type MarbleStyle } from '../art/marble';
import { SOUND_MODES, type SoundMode } from '../audio/sound';
import { PHOTO_CONTRASTS, type PhotoContrast } from '../core/quantize';

/**
 * Merkt sich im Browser, welche Bilder fertig sind, wo man bei einem angefangenen Bild steht und welche eigenen
 * Fotos zur Sammlung gehören. Alles bleibt auf dem Gerät.
 * Der Speicher kann fehlen oder gesperrt sein (privates Fenster, eingebettete Ansicht): Dann läuft alles
 * weiter, nur ohne Gedächtnis.
 */
export interface Progress {
  cur: number[];
  tray: number[];
}

/** Das Raster eines eigenen Fotos in einer Detailtiefe, so wie es beim ersten Spielen entstanden ist */
export interface OwnLevel {
  /** Murmelfarben in der Einstellung "naturnah" */
  palette: string[];
  /** Farben des Fotos je Farbnummer. Aus ihnen entstehen die Murmelfarben; ältere Stände kennen sie noch nicht. */
  source?: string[];
  target: number[];
}

/** Ein eigenes Foto in der Sammlung. Das Foto selbst liegt getrennt davon, siehe `ownImage`. */
export interface OwnRecord {
  id: string;
  /** je Detailtiefe (Murmeln je Kante) das Raster */
  levels: Record<string, OwnLevel>;
}

interface Saved {
  finished: string[];
  progress: Record<string, Progress>;
  /** frühere Stände kannten nur an und aus */
  sound: SoundMode | boolean;
  /** in den Einstellungen gewählter Entwurf für leere Felder */
  holes?: HoleStyle;
  /** in den Einstellungen gewählt: Murmeln mit oder ohne Spiegelung */
  marbles?: MarbleStyle;
  /** in den Einstellungen gewählt: Murmeln je Kante für alle Bilder; fehlt = jedes Bild so, wie es gemalt wurde */
  detail?: number | null;
  /** in den Einstellungen gewählt: Zahl der Mulden auf dem Holzbrett */
  tray?: number;
  /** in den Einstellungen gewählt: Tempo der rollenden Murmeln als Vielfaches der Voreinstellung */
  tempo?: number;
  /** in den Einstellungen gewählt: wie stark sich die Murmelfarben eigener Fotos unterscheiden */
  contrast?: PhotoContrast;
  /** eigene Fotos, in der Reihenfolge, in der sie dazukamen */
  own?: OwnRecord[];
}

const KEY = 'murmel.v1';
/** Die Fotos liegen einzeln unter eigenen Namen: Passt eins nicht mehr in den Speicher, bleibt der Rest heil. */
const IMAGE_KEY = 'murmel.bild.';
/** Fotos, die nicht dauerhaft gespeichert werden konnten, bleiben wenigstens bis zum Schließen erhalten. */
const images = new Map<string, string>();
const fresh = (): Saved => ({ finished: [], progress: {}, sound: 'alles' });

let cache: Saved | null = null;

function read(): Saved {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...fresh(), ...(JSON.parse(raw) as Partial<Saved>) } : fresh();
  } catch {
    cache = fresh();
  }
  return cache;
}

function write(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // ohne Speicher geht es ohne Gedächtnis weiter
  }
}

export const store = {
  isFinished: (id: string): boolean => read().finished.includes(id),
  progress: (id: string): Progress | undefined => read().progress[id],
  saveProgress(id: string, progress: Progress): void {
    read().progress[id] = progress;
    write();
  },
  clearProgress(id: string): void {
    delete read().progress[id];
    write();
  },
  markFinished(id: string): void {
    const s = read();
    if (!s.finished.includes(id)) s.finished.push(id);
    delete s.progress[id];
    write();
  },
  get sound(): SoundMode {
    const saved = read().sound;
    if (saved === false) return 'aus';
    return SOUND_MODES.find((mode) => mode === saved) ?? 'alles';
  },
  set sound(mode: SoundMode) {
    read().sound = mode;
    write();
  },
  get holes(): HoleStyle | undefined {
    const saved = read().holes;
    return HOLE_STYLES.find((style) => style === saved);
  },
  set holes(style: HoleStyle | undefined) {
    read().holes = style;
    write();
  },
  get marbles(): MarbleStyle | undefined {
    const saved = read().marbles;
    return MARBLE_STYLES.find((style) => style === saved);
  },
  set marbles(style: MarbleStyle | undefined) {
    read().marbles = style;
    write();
  },
  get detail(): number | null {
    const saved = read().detail;
    return typeof saved === 'number' && saved >= 4 && saved <= 80 ? Math.round(saved) : null;
  },
  set detail(size: number | null) {
    read().detail = size;
    write();
  },
  get tray(): number | undefined {
    const saved = read().tray;
    return typeof saved === 'number' && saved >= 1 && saved <= 400 ? Math.round(saved) : undefined;
  },
  set tray(size: number | undefined) {
    read().tray = size;
    write();
  },
  get tempo(): number | undefined {
    const saved = read().tempo;
    return typeof saved === 'number' && saved >= 0.2 && saved <= 6 ? saved : undefined;
  },
  set tempo(tempo: number | undefined) {
    read().tempo = tempo;
    write();
  },
  get contrast(): PhotoContrast {
    const saved = read().contrast;
    return PHOTO_CONTRASTS.find((c) => c === saved) ?? PHOTO_CONTRASTS[0];
  },
  set contrast(contrast: PhotoContrast) {
    read().contrast = contrast;
    write();
  },
  /** Eigene Fotos der Sammlung. */
  own: (): OwnRecord[] => read().own ?? [],
  /** Das Foto zu einem eigenen Bild als Daten-Adresse, falls es noch da ist. */
  ownImage(id: string): string | null {
    const kept = images.get(id);
    if (kept) return kept;
    try {
      return localStorage.getItem(IMAGE_KEY + id);
    } catch {
      return null;
    }
  },
  addOwn(id: string, image: string): void {
    const s = read();
    s.own = [...(s.own ?? []), { id, levels: {} }];
    images.set(id, image);
    try {
      localStorage.setItem(IMAGE_KEY + id, image);
    } catch {
      // kein Platz mehr oder kein Speicher: Das Bild bleibt, bis die Seite geschlossen wird
    }
    write();
  },
  setOwnLevel(id: string, size: number, level: OwnLevel): void {
    const record = read().own?.find((r) => r.id === id);
    if (!record) return;
    record.levels[String(size)] = level;
    write();
  },
  /** Entfernt ein eigenes Bild samt Foto, Spielständen und Fertig-Vermerken in jeder Detailtiefe. */
  removeOwn(id: string): void {
    const s = read();
    s.own = (s.own ?? []).filter((r) => r.id !== id);
    const mine = (key: string): boolean => key === id || key.startsWith(`${id}@`);
    s.finished = s.finished.filter((key) => !mine(key));
    for (const key of Object.keys(s.progress)) if (mine(key)) delete s.progress[key];
    images.delete(id);
    try {
      localStorage.removeItem(IMAGE_KEY + id);
    } catch {
      // nichts zu löschen
    }
    write();
  },
  /**
   * Bittet den Browser, den Spielstand nicht von sich aus zu löschen. Als App auf dem Home-Bildschirm
   * stimmt Safari dem in der Regel zu. Eine Ablehnung ändert nichts am Spiel.
   */
  keep(): void {
    try {
      void navigator.storage
        ?.persist?.()
        .then(() => undefined)
        .catch(() => undefined);
    } catch {
      // nicht jede Umgebung kennt diese Bitte
    }
  },
};
