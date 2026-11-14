import { HOLE_STYLES, type HoleStyle, hole } from '../art/holes';
import { MARBLE_STYLES, type MarbleStyle, marble } from '../art/marble';
import { PAPER } from '../art/materials';
import { SOUND_MODES, type SoundMode } from '../audio/sound';
import { mix } from '../core/color';
import { PHOTO_CONTRASTS, type PhotoContrast } from '../core/quantize';
import { LANGUAGE_NAMES, LANGUAGES, type Language, type TextKey, t } from './i18n';

/** Was die Einstellungen lesen und ändern dürfen. Jede Wahl gilt sofort, es gibt kein Speichern und kein Abbrechen. */
export interface SettingsHandlers {
  holes(): HoleStyle;
  setHoles(style: HoleStyle): void;
  marbles(): MarbleStyle;
  setMarbles(style: MarbleStyle): void;
  /** Murmeln je Kante für alle Bilder; null heißt: jedes Bild so, wie es gemalt wurde */
  detail(): number | null;
  setDetail(size: number | null): void;
  /** Mulden auf dem Holzbrett. `setTray` meldet, ob die neue Größe schon im laufenden Spiel gilt. */
  tray(): number;
  setTray(size: number): boolean;
  /** Tempo der rollenden Murmeln, einer der Werte aus `tempos` */
  tempo(): number;
  setTempo(tempo: number): void;
  /** wie stark sich die Murmelfarben eigener Fotos unterscheiden */
  contrast(): PhotoContrast;
  setContrast(contrast: PhotoContrast): void;
  sound(): SoundMode;
  setSound(mode: SoundMode): void;
  /** die gewählte Sprache; null heißt: die Sprache des Geräts */
  language(): Language | null;
  setLanguage(language: Language | null): void;
}

/** Was die Einstellungen zur Auswahl stellen */
export interface SettingsOptions {
  readonly detailSizes: readonly number[];
  readonly traySizes: readonly number[];
  /** Stufen des Reglers für das Tempo, von langsam nach schnell */
  readonly tempos: readonly number[];
}

/** Wie die Stufen des Tempo-Reglers vorgelesen werden */
const TEMPO_TEXT: readonly TextKey[] = ['tempo_1', 'tempo_2', 'tempo_3', 'tempo_4', 'tempo_5', 'tempo_6'];

/** Farben der kleinen Vorschau: eine mittlere, eine dunkle und eine helle. An den Rändern entscheidet sich die Lesbarkeit. */
const SAMPLE = ['#35978a', '#2c3f86', '#f6e9c0'];
const CELL = 40;
const DPR = 2;

function sampleContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  canvas.width = CELL * 3 * DPR;
  canvas.height = CELL * DPR;
  const x = canvas.getContext('2d');
  x?.setTransform(DPR, 0, 0, DPR, 0, 0);
  return x;
}

/** Zeichnet, wie ein Entwurf für leere Felder aussieht: links eine Murmel, daneben zwei leere Felder. */
function drawHoleSample(canvas: HTMLCanvasElement, style: HoleStyle, marbles: MarbleStyle): void {
  const x = sampleContext(canvas);
  if (!x) return;
  // unter allem liegt die blasse Vorzeichnung
  x.fillStyle = mix(PAPER, SAMPLE[0], 0.36);
  x.fillRect(0, 0, CELL, CELL);
  marble(x, CELL / 2, CELL / 2, CELL * 0.82 * 0.48, SAMPLE[0], 0.4, marbles);
  [SAMPLE[0], SAMPLE[1]].forEach((color, k) => {
    x.fillStyle = mix(PAPER, color, 0.36);
    x.fillRect(CELL * (k + 1), 0, CELL, CELL);
    hole(x, CELL * (k + 1.5), CELL / 2, CELL, color, style);
  });
}

/** Zeichnet drei Murmeln in der gewählten Art. */
function drawMarbleSample(canvas: HTMLCanvasElement, style: MarbleStyle): void {
  const x = sampleContext(canvas);
  if (!x) return;
  SAMPLE.forEach((color, k) => {
    x.fillStyle = mix(PAPER, SAMPLE[(k + 1) % SAMPLE.length], 0.36);
    x.fillRect(CELL * k, 0, CELL, CELL);
    marble(x, CELL * (k + 0.5), CELL / 2, CELL * 0.82 * 0.48, color, 0.4 + k, style);
  });
}

/** Texte der Wahlmöglichkeiten, die mit der Sprache wechseln: der Textknoten und woher sein Inhalt kommt */
const labels: [Text, () => string][] = [];

function choice(label: string | (() => string), value: string, withSample: boolean): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.dataset.value = value;
  if (withSample) {
    const sample = document.createElement('canvas');
    sample.className = 'choice-sample';
    sample.setAttribute('aria-hidden', 'true');
    button.append(sample);
  }
  if (typeof label === 'string') {
    button.append(label);
  } else {
    const text = document.createTextNode(label());
    labels.push([text, label]);
    button.append(text);
  }
  return button;
}

const sampleOf = (button: HTMLButtonElement): HTMLCanvasElement => button.querySelector('canvas') as HTMLCanvasElement;

/** Die Einstellungen: ein Blatt Papier, das sich über das Spiel legt. */
export class SettingsSheet {
  private readonly holeButtons: HTMLButtonElement[];
  private readonly marbleButtons: HTMLButtonElement[];
  private readonly soundButtons: HTMLButtonElement[];
  private readonly detailButtons: HTMLButtonElement[];
  private readonly trayButtons: HTMLButtonElement[];
  private readonly trayNote: HTMLElement;
  private readonly contrastButtons: HTMLButtonElement[];
  private readonly tempoSlider: HTMLInputElement;
  private readonly languageButtons: HTMLButtonElement[];

  constructor(
    private readonly dialog: HTMLDialogElement,
    private readonly handlers: SettingsHandlers,
    private readonly options: SettingsOptions,
  ) {
    const find = (name: string): HTMLElement => dialog.querySelector(`[data-part="${name}"]`) as HTMLElement;

    // Detailtiefe: "wie gemalt" lässt jedem Bild seine eigene Größe, sonst gilt eine Kantenlänge für alle
    const details: (number | null)[] = [null, ...options.detailSizes];
    this.detailButtons = details.map((size) => {
      const button = choice(size === null ? () => t('detail_painted') : `${size} × ${size}`, String(size ?? ''), false);
      button.addEventListener('click', () => {
        handlers.setDetail(size);
        this.sync();
      });
      return button;
    });
    find('detail').append(...this.detailButtons);

    this.trayNote = find('trayNote');
    this.trayButtons = options.traySizes.map((size) => {
      const button = choice(String(size), String(size), false);
      button.addEventListener('click', () => {
        // Liegen gerade mehr Murmeln auf dem Brett, als das kleinere fasst, gilt die Wahl erst beim nächsten Bild.
        this.trayNote.hidden = handlers.setTray(size);
        this.sync();
      });
      return button;
    });
    find('tray').append(...this.trayButtons);

    // Tempo: ein Regler mit festen Stufen. Jede Bewegung gilt sofort.
    this.tempoSlider = find('tempo') as HTMLInputElement;
    this.tempoSlider.min = '0';
    this.tempoSlider.max = String(options.tempos.length - 1);
    this.tempoSlider.step = '1';
    this.tempoSlider.addEventListener('input', () => {
      handlers.setTempo(options.tempos[Number(this.tempoSlider.value)] ?? 1);
      this.sync();
    });

    this.contrastButtons = PHOTO_CONTRASTS.map((contrast) => {
      const button = choice(() => t(`contrast_${contrast}`), contrast, false);
      button.addEventListener('click', () => {
        handlers.setContrast(contrast);
        this.sync();
      });
      return button;
    });
    find('contrast').append(...this.contrastButtons);

    this.holeButtons = HOLE_STYLES.map((style) => {
      const button = choice(() => t(`hole_${style}`), style, true);
      button.addEventListener('click', () => {
        handlers.setHoles(style);
        this.sync();
      });
      return button;
    });
    find('holes').append(...this.holeButtons);

    this.marbleButtons = MARBLE_STYLES.map((style) => {
      const button = choice(() => t(`marble_${style}`), style, true);
      drawMarbleSample(sampleOf(button), style);
      button.addEventListener('click', () => {
        handlers.setMarbles(style);
        this.sync();
      });
      return button;
    });
    find('marbles').append(...this.marbleButtons);

    this.soundButtons = SOUND_MODES.map((mode) => {
      const button = choice(() => t(`sound_${mode}`), mode, false);
      button.addEventListener('click', () => {
        handlers.setSound(mode);
        this.sync();
      });
      return button;
    });
    find('sound').append(...this.soundButtons);

    // Sprache: "Automatisch" folgt dem Gerät. Die Sprachen selbst heißen in jeder Sprache gleich.
    const languages: (Language | null)[] = [null, ...LANGUAGES];
    this.languageButtons = languages.map((language) => {
      const label = language === null ? () => t('language_auto') : LANGUAGE_NAMES[language];
      const button = choice(label, language ?? '', false);
      if (language) button.lang = language;
      button.addEventListener('click', () => {
        handlers.setLanguage(language);
        this.sync();
      });
      return button;
    });
    find('language').append(...this.languageButtons);

    find('done').addEventListener('click', () => dialog.close());
    // Ein Tipp neben das Blatt schließt es. Das Blatt selbst füllt den Dialog ganz aus,
    // deshalb trifft nur ein Tipp auf den Hintergrund den Dialog direkt.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  open(): void {
    this.trayNote.hidden = true;
    this.sync();
    if (!this.dialog.open) this.dialog.showModal();
  }

  /** Die Sprache hat gewechselt: Die Wahlmöglichkeiten heißen jetzt anders. */
  relabel(): void {
    for (const [text, label] of labels) text.data = label();
    this.sync();
  }

  private sync(): void {
    const holes = this.handlers.holes();
    const marbles = this.handlers.marbles();
    const sound = this.handlers.sound();
    for (const b of this.holeButtons) {
      b.setAttribute('aria-pressed', String(b.dataset.value === holes));
      // die Vorschau zeigt die Murmel so, wie sie gerade eingestellt ist
      drawHoleSample(sampleOf(b), b.dataset.value as HoleStyle, marbles);
    }
    for (const b of this.marbleButtons) b.setAttribute('aria-pressed', String(b.dataset.value === marbles));
    const detail = String(this.handlers.detail() ?? '');
    for (const b of this.detailButtons) b.setAttribute('aria-pressed', String(b.dataset.value === detail));
    const tray = String(this.handlers.tray());
    for (const b of this.trayButtons) b.setAttribute('aria-pressed', String(b.dataset.value === tray));
    // der Regler steht auf der Stufe, die dem eingestellten Tempo am nächsten liegt
    const tempo = this.handlers.tempo();
    const tempos = this.options.tempos;
    const step = tempos.reduce((best, t, k) => (Math.abs(t - tempo) < Math.abs(tempos[best] - tempo) ? k : best), 0);
    this.tempoSlider.value = String(step);
    const said = TEMPO_TEXT[step];
    this.tempoSlider.setAttribute('aria-valuetext', said ? t(said) : '');
    const contrast = this.handlers.contrast();
    for (const b of this.contrastButtons) b.setAttribute('aria-pressed', String(b.dataset.value === contrast));
    for (const b of this.soundButtons) b.setAttribute('aria-pressed', String(b.dataset.value === sound));
    const language = this.handlers.language() ?? '';
    for (const b of this.languageButtons) b.setAttribute('aria-pressed', String(b.dataset.value === language));
  }
}
