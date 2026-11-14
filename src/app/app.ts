import { HOLE_STYLES, type HoleStyle } from '../art/holes';
import { MARBLE_STYLES, type MarbleStyle, marble } from '../art/marble';
import { grainCanvas } from '../art/paint';
import { SOUND_MODES, Sound, type SoundMode } from '../audio/sound';
import { DETAIL_SIZES, type Mood } from '../core/scene';
import { renderShelf } from './home';
import { addOwn, DEFAULT_MOOD, loadOwn, ownPictures, type Picture, pictures, removeOwn } from './library';
import { PlayScreen, TRAY_DEFAULT, TRAY_SIZES } from './play';
import { SettingsSheet } from './settings';
import { store } from './storage';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** Wie die drei Klangstufen heißen und was beim Umschalten kurz dazu gesagt wird */
const SOUND_TEXT: Record<SoundMode, { label: string; said: string }> = {
  alles: { label: 'Klang an', said: 'Klang an: Murmeln und Raum.' },
  murmeln: { label: 'Nur Murmeln', said: 'Nur die Murmeln klingen.' },
  aus: { label: 'Klang aus', said: 'Still.' },
};

/** Färbt den Himmel hinter allem in der Stimmung des Bildes. Der alte Verlauf blendet langsam aus. */
function setMood(mood: Mood): void {
  const sky = el('sky');
  const old = sky.querySelector('.sky-layer') as HTMLElement | null;
  const next = document.createElement('div');
  next.className = 'sky-layer';
  next.style.background = `linear-gradient(180deg, ${mood.top}, ${mood.bottom})`;
  sky.prepend(next);
  if (old) {
    old.classList.add('leaving');
    window.setTimeout(() => old.remove(), 2000);
  }
  const root = document.documentElement.style;
  root.setProperty('--ink', mood.ink);
  root.setProperty('--sky-top', mood.top);
  root.setProperty('--sky-bottom', mood.bottom);
  document.body.style.background = mood.top;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mood.top);
}

/** Läuft das Spiel als App vom Home-Bildschirm? Dann liegt die Statusleiste über dem Himmel. */
function isStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return legacy || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

export function startApp(): void {
  const sound = new Sound(store.sound);
  const home = el('home');
  const shelf = el('shelf');
  const photo = el<HTMLInputElement>('photo');
  const playSound = el<HTMLButtonElement>('sound');

  document.documentElement.classList.toggle('standalone', isStandalone());
  store.keep();

  // Papierkorn über dem Himmel und die Murmel als Schlusspunkt des Namens
  try {
    el('sky').style.setProperty('--grain', `url(${grainCanvas().toDataURL()})`);
  } catch {
    // ohne Korn geht es auch
  }
  const dot = el<HTMLCanvasElement>('dot').getContext('2d');
  if (dot) marble(dot, 46, 44, 34, '#e6782a', 0.6);

  // Detailtiefe: Murmeln je Kante für alle Bilder; null lässt jedem Bild die Größe, für die es gemalt wurde
  let detail: number | null = store.detail;
  // Die Sammlung: erst die mitgelieferten Bilder, dann die eigenen, dann das leere Blatt für ein neues Foto.
  const collection = (): Picture[] => [...pictures(detail), ...ownPictures(detail)];
  const fillShelf = (): void =>
    renderShelf(shelf, collection(), {
      open,
      choosePhoto: () => photo.click(),
      remove: (picture) => {
        removeOwn(picture.id);
        fillShelf();
      },
    });
  const showHome = (): void => {
    setMood(DEFAULT_MOOD);
    sound.setRoot(DEFAULT_MOOD.root);
    fillShelf();
    home.hidden = false;
  };
  const play = new PlayScreen(
    {
      root: el('play'),
      canvas: el<HTMLCanvasElement>('board'),
      bar: el('bar'),
      back: el<HTMLButtonElement>('back'),
      undo: el<HTMLButtonElement>('undo'),
      fit: el<HTMLButtonElement>('fit'),
      whisper: el('whisper'),
      finish: el('finish'),
      again: el<HTMLButtonElement>('again'),
      onward: el<HTMLButtonElement>('onward'),
    },
    sound,
    showHome,
  );
  function open(picture: Picture, fresh = false): void {
    home.hidden = true;
    setMood(picture.mood);
    play.open(picture, fresh);
  }

  // ---------- Klang ----------
  const showSound = (): void => {
    playSound.dataset.mode = sound.mode;
    playSound.setAttribute('aria-label', `${SOUND_TEXT[sound.mode].label}. Tippen schaltet um.`);
  };
  const setSound = (mode: SoundMode): void => {
    sound.setMode(mode);
    store.sound = mode;
    showSound();
    // ein leiser Ton als Antwort, sobald der Klang wach ist
    if (mode !== 'aus') window.setTimeout(() => sound.pick(), 200);
  };
  // Das Symbol in der Spielleiste schaltet die drei Stufen der Reihe nach durch.
  playSound.addEventListener('click', () => {
    const before = sound.mode;
    const next = SOUND_MODES[(SOUND_MODES.indexOf(before) + 1) % SOUND_MODES.length];
    setSound(next);
    // Der Klang richtet sich nach dem Stummmodus des Geräts. Wer ihn gerade einschaltet und nichts hört,
    // sucht sonst den Fehler im Spiel.
    play.tell(before === 'aus' ? 'Klang an. Bleibt es still, ist das iPad stummgeschaltet.' : SOUND_TEXT[next].said);
  });
  showSound();

  // ---------- Einstellungen ----------
  let holes: HoleStyle = store.holes ?? HOLE_STYLES[0];
  const setHoles = (style: HoleStyle): void => {
    holes = style;
    play.setHoleStyle(style);
  };
  setHoles(holes);
  let marbles: MarbleStyle = store.marbles ?? MARBLE_STYLES[0];
  const setMarbles = (style: MarbleStyle): void => {
    marbles = style;
    play.setMarbleStyle(style);
  };
  setMarbles(marbles);
  let traySize = store.tray ?? TRAY_DEFAULT;
  play.setTraySize(traySize);
  const setDetail = (size: number | null): void => {
    detail = size;
    const now = play.current;
    // Im Spiel wechselt das offene Bild sofort in die neue Größe; sein Stand in der alten bleibt gespeichert.
    if (home.hidden && now) open(now.picture.atSize(size));
    else fillShelf();
  };
  const settings = new SettingsSheet(
    el<HTMLDialogElement>('settings'),
    {
      holes: () => holes,
      setHoles: (style) => {
        store.holes = style;
        setHoles(style);
      },
      marbles: () => marbles,
      setMarbles: (style) => {
        store.marbles = style;
        setMarbles(style);
      },
      detail: () => detail,
      setDetail: (size) => {
        store.detail = size;
        setDetail(size);
      },
      tray: () => traySize,
      setTray: (size) => {
        traySize = size;
        store.tray = size;
        return play.setTraySize(size);
      },
      sound: () => sound.mode,
      setSound,
    },
    { detailSizes: DETAIL_SIZES, traySizes: TRAY_SIZES },
  );
  for (const id of ['homeSettings', 'playSettings']) el(id).addEventListener('click', () => settings.open());

  // Der Raum atmet im Takt des Himmelslichts: Der Klang richtet sich nach der Uhr der Animation.
  const light = document.querySelector('.sky-light')?.getAnimations?.()[0];
  void light?.ready.then(() => sound.alignBreath(Number(light.startTime) || 0)).catch(() => undefined);

  // Ton gibt es erst nach einer Berührung, und bei Fingern zählt dafür das Loslassen (pointerup), nicht das
  // Aufsetzen. Jede Berührung ist zugleich ein Reparaturversuch nach einer Unterbrechung (App-Wechsel, Anruf).
  for (const type of ['pointerup', 'touchend', 'click', 'keydown'] as const) {
    window.addEventListener(type, () => sound.unlock(), { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sound.wake();
  });

  // Safari: Zwei-Finger-Zoom abfangen, er lässt sich dort nicht per Einstellung abschalten.
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  photo.addEventListener('change', () => {
    const file = photo.files?.[0];
    photo.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const picture = addOwn(image, detail);
      URL.revokeObjectURL(url);
      if (picture) open(picture, true);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  });

  showHome();
  // Eigene Fotos muss der Browser erst entpacken: Sie erscheinen einen Augenblick später in der Sammlung.
  void loadOwn().then(() => {
    if (!home.hidden && ownPictures(detail).length) fillShelf();
  });

  // Zugang für automatische Tests und zum Vorführen (in der Konsole: murmel.open('mond'); murmel.solve())
  Object.assign(window, {
    murmel: {
      ids: () => pictures(detail).map((p) => p.id),
      open: (id: string, fresh = true) => {
        const picture = collection().find((p) => p.id === id);
        if (picture) open(picture, fresh);
        return Boolean(picture);
      },
      solve: () => play.solve(),
      next: () => play.nextMove(),
      status: () => play.status(),
      home: () => play.close(),
      sound: () => sound.mode,
      wood: () => play.points()?.wood,
      group: () => play.points()?.group ?? null,
      slot: () => play.points()?.slot ?? null,
      holes: (style: HoleStyle) => setHoles(style),
      marbles: (style: MarbleStyle) => setMarbles(style),
      detail: (size: number | null) => setDetail(size),
      tray: (size: number) => {
        traySize = size;
        return play.setTraySize(size);
      },
    },
  });
}
