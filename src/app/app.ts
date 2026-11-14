import { marble } from '../art/marble';
import { grainCanvas } from '../art/paint';
import { SOUND_MODES, Sound, type SoundMode } from '../audio/sound';
import type { Mood } from '../core/scene';
import { renderShelf } from './home';
import { DEFAULT_MOOD, fromPhoto, type Picture, pictures } from './library';
import { PlayScreen } from './play';
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
  const homeSound = el<HTMLButtonElement>('homeSound');
  const playSound = el<HTMLButtonElement>('sound');
  const homeNote = el('homeNote');

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

  const showHome = (): void => {
    setMood(DEFAULT_MOOD);
    sound.setRoot(DEFAULT_MOOD.root);
    renderShelf(shelf, pictures(), { open, choosePhoto: () => photo.click() });
    home.hidden = false;
  };
  const play = new PlayScreen(
    {
      root: el('play'),
      canvas: el<HTMLCanvasElement>('board'),
      bar: el('bar'),
      back: el<HTMLButtonElement>('back'),
      undo: el<HTMLButtonElement>('undo'),
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
    const text = SOUND_TEXT[sound.mode];
    homeSound.textContent = text.label;
    playSound.dataset.mode = sound.mode;
    playSound.setAttribute('aria-label', `${text.label}. Tippen schaltet um.`);
  };
  let noteTimer = 0;
  const cycleSound = (): void => {
    const before = sound.mode;
    const next = SOUND_MODES[(SOUND_MODES.indexOf(before) + 1) % SOUND_MODES.length];
    sound.setMode(next);
    store.sound = next;
    showSound();
    // Der Klang richtet sich nach dem Stummmodus des Geräts. Wer ihn gerade einschaltet und nichts hört,
    // sucht sonst den Fehler im Spiel.
    const said = before === 'aus' ? 'Klang an. Bleibt es still, ist das iPad stummgeschaltet.' : SOUND_TEXT[next].said;
    if (home.hidden) {
      play.tell(said);
    } else {
      homeNote.textContent = said;
      homeNote.classList.add('heard');
      clearTimeout(noteTimer);
      noteTimer = window.setTimeout(() => homeNote.classList.remove('heard'), 4200);
    }
    // ein leiser Ton als Antwort, sobald der Klang wach ist
    if (next !== 'aus') window.setTimeout(() => sound.pick(), 200);
  };
  homeSound.addEventListener('click', cycleSound);
  playSound.addEventListener('click', cycleSound);
  showSound();

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
      const picture = fromPhoto(image);
      URL.revokeObjectURL(url);
      if (picture) open(picture, true);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  });

  showHome();

  // Zugang für automatische Tests und zum Vorführen (in der Konsole: murmel.open('mond'); murmel.solve())
  Object.assign(window, {
    murmel: {
      ids: () => pictures().map((p) => p.id),
      open: (id: string, fresh = true) => {
        const picture = pictures().find((p) => p.id === id);
        if (picture) open(picture, fresh);
        return Boolean(picture);
      },
      solve: () => play.solve(),
      next: () => play.nextMove(),
      status: () => play.status(),
      home: () => play.close(),
      sound: () => sound.mode,
    },
  });
}
