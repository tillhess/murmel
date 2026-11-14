import { HOLE_NAMES, HOLE_STYLES, type HoleStyle, hole, holeVariants, showsPicture } from '../art/holes';
import { MARBLE_NAMES, MARBLE_STYLES, type MarbleStyle, marble } from '../art/marble';
import { PAPER } from '../art/materials';
import { SOUND_MODES, type SoundMode } from '../audio/sound';
import { mix } from '../core/color';

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
  sound(): SoundMode;
  setSound(mode: SoundMode): void;
}

/** Was die Einstellungen zur Auswahl stellen */
export interface SettingsOptions {
  readonly detailSizes: readonly number[];
  readonly traySizes: readonly number[];
}

const SOUND_CHOICES: Record<SoundMode, string> = {
  alles: 'Alles',
  murmeln: 'Nur Murmeln',
  aus: 'Still',
};

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
  // unter der Murmel die blasse Vorzeichnung; unter den leeren Feldern je nach Entwurf schon das Bild
  x.fillStyle = mix(PAPER, SAMPLE[0], 0.36);
  x.fillRect(0, 0, CELL, CELL);
  marble(x, CELL / 2, CELL / 2, CELL * 0.82 * 0.48, SAMPLE[0], 0.4, marbles);
  [SAMPLE[0], SAMPLE[1]].forEach((color, k) => {
    x.fillStyle = showsPicture(style) ? color : mix(PAPER, color, 0.36);
    x.fillRect(CELL * (k + 1), 0, CELL, CELL);
    hole(x, CELL * (k + 1.5), CELL / 2, CELL, color, style, k % holeVariants(style));
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

function choice(label: string, value: string, withSample: boolean): HTMLButtonElement {
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
  button.append(label);
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

  constructor(
    private readonly dialog: HTMLDialogElement,
    private readonly handlers: SettingsHandlers,
    options: SettingsOptions,
  ) {
    const find = (name: string): HTMLElement => dialog.querySelector(`[data-part="${name}"]`) as HTMLElement;

    // Detailtiefe: "wie gemalt" lässt jedem Bild seine eigene Größe, sonst gilt eine Kantenlänge für alle
    const details: (number | null)[] = [null, ...options.detailSizes];
    this.detailButtons = details.map((size) => {
      const button = choice(size === null ? 'Wie gemalt' : `${size} × ${size}`, String(size ?? ''), false);
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

    this.holeButtons = HOLE_STYLES.map((style) => {
      const button = choice(HOLE_NAMES[style], style, true);
      button.addEventListener('click', () => {
        handlers.setHoles(style);
        this.sync();
      });
      return button;
    });
    find('holes').append(...this.holeButtons);

    this.marbleButtons = MARBLE_STYLES.map((style) => {
      const button = choice(MARBLE_NAMES[style], style, true);
      drawMarbleSample(sampleOf(button), style);
      button.addEventListener('click', () => {
        handlers.setMarbles(style);
        this.sync();
      });
      return button;
    });
    find('marbles').append(...this.marbleButtons);

    this.soundButtons = SOUND_MODES.map((mode) => {
      const button = choice(SOUND_CHOICES[mode], mode, false);
      button.addEventListener('click', () => {
        handlers.setSound(mode);
        this.sync();
      });
      return button;
    });
    find('sound').append(...this.soundButtons);

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
    for (const b of this.soundButtons) b.setAttribute('aria-pressed', String(b.dataset.value === sound));
  }
}
