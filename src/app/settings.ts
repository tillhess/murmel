import { HOLE_NAMES, HOLE_STYLES, type HoleStyle, hole } from '../art/holes';
import { marble } from '../art/marble';
import { PAPER } from '../art/materials';
import { SOUND_MODES, type SoundMode } from '../audio/sound';
import { mix } from '../core/color';

/** Was die Einstellungen lesen und ändern dürfen. Jede Wahl gilt sofort, es gibt kein Speichern und kein Abbrechen. */
export interface SettingsHandlers {
  holes(): HoleStyle;
  setHoles(style: HoleStyle): void;
  sound(): SoundMode;
  setSound(mode: SoundMode): void;
}

const SOUND_CHOICES: Record<SoundMode, string> = {
  alles: 'Alles',
  murmeln: 'Nur Murmeln',
  aus: 'Still',
};

/** Farben der kleinen Vorschau: eine mittlere und eine dunkle, denn an der dunklen entscheidet sich die Lesbarkeit. */
const SAMPLE = ['#35978a', '#2c3f86'];

/** Zeichnet, wie ein Entwurf aussieht: links eine Murmel, daneben zwei leere Felder. */
function drawSample(canvas: HTMLCanvasElement, style: HoleStyle): void {
  const cell = 40;
  const dpr = 2;
  const width = cell * 3;
  canvas.width = width * dpr;
  canvas.height = cell * dpr;
  const x = canvas.getContext('2d');
  if (!x) return;
  x.scale(dpr, dpr);
  // blasse Vorzeichnung in der Zielfarbe, wie im Spiel
  x.fillStyle = mix(PAPER, SAMPLE[0], 0.36);
  x.fillRect(0, 0, cell * 2, cell);
  x.fillStyle = mix(PAPER, SAMPLE[1], 0.36);
  x.fillRect(cell * 2, 0, cell, cell);
  marble(x, cell / 2, cell / 2, cell * 0.82 * 0.48, SAMPLE[0], 0.4);
  hole(x, cell * 1.5, cell / 2, cell, SAMPLE[0], style);
  hole(x, cell * 2.5, cell / 2, cell, SAMPLE[1], style);
}

function choice(label: string, value: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.dataset.value = value;
  button.append(label);
  return button;
}

/** Die Einstellungen: ein Blatt Papier, das sich über das Spiel legt. */
export class SettingsSheet {
  private readonly holeButtons: HTMLButtonElement[];
  private readonly soundButtons: HTMLButtonElement[];

  constructor(
    private readonly dialog: HTMLDialogElement,
    private readonly handlers: SettingsHandlers,
  ) {
    const find = (name: string): HTMLElement => dialog.querySelector(`[data-part="${name}"]`) as HTMLElement;

    this.holeButtons = HOLE_STYLES.map((style) => {
      const button = choice(HOLE_NAMES[style], style);
      const sample = document.createElement('canvas');
      sample.className = 'choice-sample';
      sample.setAttribute('aria-hidden', 'true');
      drawSample(sample, style);
      button.prepend(sample);
      button.addEventListener('click', () => {
        handlers.setHoles(style);
        this.sync();
      });
      return button;
    });
    find('holes').append(...this.holeButtons);

    this.soundButtons = SOUND_MODES.map((mode) => {
      const button = choice(SOUND_CHOICES[mode], mode);
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
    this.sync();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private sync(): void {
    const holes = this.handlers.holes();
    for (const b of this.holeButtons) b.setAttribute('aria-pressed', String(b.dataset.value === holes));
    const sound = this.handlers.sound();
    for (const b of this.soundButtons) b.setAttribute('aria-pressed', String(b.dataset.value === sound));
  }
}
