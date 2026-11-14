import { HOLE_STYLES, type HoleStyle } from '../art/holes';
import { SOUND_MODES, type SoundMode } from '../audio/sound';

/**
 * Merkt sich im Browser, welche Bilder fertig sind und wo man bei einem angefangenen Bild steht.
 * Der Speicher kann fehlen oder gesperrt sein (privates Fenster, eingebettete Ansicht): Dann läuft alles
 * weiter, nur ohne Gedächtnis.
 */
export interface Progress {
  cur: number[];
  tray: number[];
}

interface Saved {
  finished: string[];
  progress: Record<string, Progress>;
  /** frühere Stände kannten nur an und aus */
  sound: SoundMode | boolean;
  /** in den Einstellungen gewählter Entwurf für leere Felder */
  holes?: HoleStyle;
}

const KEY = 'murmel.v1';
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
