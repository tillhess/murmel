import type { HoleStyle } from '../art/holes';
import type { MarbleStyle } from '../art/marble';
import type { Sound } from '../audio/sound';
import { Game, type Outcome } from '../core/game';
import { colorDone, components, remaining } from '../core/grid';
import { newState } from '../core/level';
import { selectionSize, trayCount } from '../core/moves';
import { makeRng } from '../core/random';
import { suggest } from '../core/solver';
import { watchGestures } from './gestures';
import { type TextKey, t } from './i18n';
import type { Picture } from './library';
import { store } from './storage';
import { BoardView } from './view';

/** Mulden auf dem Holzbrett, solange in den Einstellungen nichts anderes gewählt ist */
export const TRAY_DEFAULT = 30;
/** Größen des Holzbretts, die die Einstellungen anbieten: große Bilder brauchen mehr Vorrat */
export const TRAY_SIZES: readonly number[] = [30, 45, 60, 90, 120];

export interface PlayElements {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  bar: HTMLElement;
  back: HTMLButtonElement;
  undo: HTMLButtonElement;
  /** zeigt wieder das ganze Bild; nur sichtbar, solange es vergrößert ist */
  fit: HTMLButtonElement;
  whisper: HTMLElement;
  finish: HTMLElement;
  again: HTMLButtonElement;
  onward: HTMLButtonElement;
}

/** Der Spielbildschirm: verbindet Spielregeln, Darstellung, Klang und Speicherstand. */
export class PlayScreen {
  private readonly view: BoardView;
  private game: Game | null = null;
  private picture: Picture | null = null;
  private readonly told: Record<string, number> = {};
  /** Farben, deren Vollendung schon einmal erklungen ist */
  private readonly settled = new Set<number>();
  private readonly probe = document.createElement('div');
  private whisperTimer = 0;
  private finishTimer = 0;
  private traySize = TRAY_DEFAULT;

  constructor(
    private readonly el: PlayElements,
    private readonly sound: Sound,
    private readonly leave: () => void,
  ) {
    this.view = new BoardView(el.canvas, {
      land: (spot, color, rank, total) => {
        if ('slot' in spot) {
          this.sound.tock(rank, total);
          return;
        }
        this.sound.clink(rank, total, color);
        // Mit der letzten Murmel einer Kette kann eine ganze Farbe fertig geworden sein: Das klingt etwas voller.
        const game = this.game;
        if (rank !== total - 1 || !game || game.solved || this.settled.has(color)) return;
        if (colorDone(game.level, game.state.cur, color)) {
          this.settled.add(color);
          this.sound.settle();
        }
      },
      finished: () => this.finished(),
      zoomed: (on) => {
        el.fit.hidden = !on;
      },
    });
    this.probe.className = 'probe';
    el.root.append(this.probe);
    watchGestures(el.canvas, this.view, (x, y) => this.tap(x, y));
    el.fit.addEventListener('click', () => this.view.resetZoom());
    el.undo.addEventListener('click', () => this.undo());
    el.back.addEventListener('click', () => this.close());
    el.onward.addEventListener('click', () => this.close());
    el.again.addEventListener('click', () => {
      if (this.picture) this.open(this.picture, true);
    });
    new ResizeObserver(() => {
      this.measure();
      this.view.resize();
      if (!el.finish.hidden) this.showFinish();
    }).observe(el.canvas);
    // Die Bildunterschrift wird auf die Zeichenfläche geschrieben: neu zeichnen, sobald die Schrift geladen ist.
    void document.fonts?.ready.then(() => this.view.redraw());
  }

  get current(): { picture: Picture; game: Game } | null {
    return this.picture && this.game ? { picture: this.picture, game: this.game } : null;
  }

  /** Öffnet ein Bild. Ein angefangenes wird fortgesetzt, außer `fresh` verlangt einen Neubeginn. */
  open(picture: Picture, fresh = false): void {
    const { level } = picture;
    clearTimeout(this.finishTimer);
    this.el.finish.hidden = true;
    this.picture = picture;
    const saved = fresh ? undefined : store.progress(picture.key);
    if (!fresh && store.isFinished(picture.key) && !saved) {
      // schon fertig: das Bild zeigen, wie es ist
      this.game = new Game(level, newState(level.target.slice(), this.traySize));
      window.setTimeout(() => this.showFinish(), 0);
    } else if (saved && saved.cur.length === level.target.length && saved.tray.length > 0) {
      this.game = new Game(level, { cur: Int16Array.from(saved.cur), tray: Int16Array.from(saved.tray) });
      // Das Brett kann inzwischen anders eingestellt sein. Passt nicht mehr alles darauf, bleibt es, wie es war.
      this.game.resizeTray(this.traySize);
    } else {
      if (fresh) store.clearProgress(picture.key);
      this.game = Game.start(level, makeRng(Date.now() >>> 0), this.traySize);
    }
    this.settled.clear();
    this.sound.setRoot(picture.mood.root);
    this.el.root.hidden = false;
    this.measure();
    this.view.show(this.game, picture.painting, picture.name);
    this.view.start();
    this.updateUndo();
    if (!this.game.solved) {
      // Bei vielen kleinen Murmeln hilft es zu wissen, dass sich das Bild vergrößern lässt.
      if (this.view.cellSize < 24) this.hint('hint_zoom');
      else this.hint('hint_start');
    }
  }

  close(): void {
    clearTimeout(this.finishTimer);
    this.view.stop();
    this.el.root.hidden = true;
    this.leave();
  }

  /** Spielt das Bild selbsttätig zu Ende (für Tests und zum Vorführen). */
  solve(): void {
    const game = this.game;
    if (!game) return;
    for (let guard = 0; guard < 20000 && !game.solved; guard++) {
      game.tapOutside(); // ein Rest vom vorigen Zug ist noch gewählt
      const s = suggest(game.level, game.state);
      if (!s) break;
      this.respond('cell' in s.select ? game.tapCell(s.select.cell) : game.tapTray(s.select.slot));
      this.respond(s.target === 'ablage' ? game.tapTray(null) : game.tapCell(s.target.cell));
    }
  }

  /** Der nächste sinnvolle Zug als zwei Bildschirmpunkte: erst auswählen, dann Ziel (für Tests). */
  nextMove(): { select: { x: number; y: number }; target: { x: number; y: number } } | null {
    const game = this.game;
    if (game && (game.selection || game.trayActive)) {
      // ein Rest vom vorigen Zug ist noch gewählt: Der vorgeschlagene Zug beginnt mit einer frischen Auswahl
      game.tapOutside();
      this.view.refresh();
    }
    const s = game && !game.solved ? suggest(game.level, game.state) : null;
    if (!s) return null;
    return { select: this.view.clientPoint(s.select), target: this.view.clientPoint(s.target) };
  }

  status(): {
    id: string;
    solved: boolean;
    remaining: number;
    inTray: number;
    /** wie viele Murmeln gerade gewählt sind */
    selected: number;
    /** wo die gewählten Murmeln liegen */
    selectedOn: 'board' | 'tray' | null;
    trayActive: boolean;
    /** wie stark das Bild vergrößert ist (1 = ganz zu sehen) */
    zoom: number;
    /** Murmeln je Kante und Mulden auf dem Holzbrett */
    size: number;
    tray: number;
    busy: boolean;
    finishShown: boolean;
    /** Tempo der rollenden Murmeln (1 = Voreinstellung) */
    tempo: number;
    /** die Murmelfarben des Bildes */
    colors: string[];
  } | null {
    if (!this.game || !this.picture) return null;
    return {
      id: this.picture.id,
      solved: this.game.solved,
      remaining: remaining(this.game.level, this.game.state.cur),
      inTray: trayCount(this.game.state),
      selected: this.game.selection ? selectionSize(this.game.selection) : 0,
      selectedOn: this.game.selection?.source ?? null,
      trayActive: this.game.trayActive,
      zoom: this.view.zoom,
      size: this.game.level.w,
      tray: this.game.state.tray.length,
      busy: this.view.busy,
      finishShown: !this.el.finish.hidden,
      tempo: this.view.tempo,
      colors: [...this.game.level.palette],
    };
  }

  /**
   * Bildschirmpunkte für Tests, die wie ein Mensch tippen: das Holz des Bretts, die kleinste noch nicht gewählte
   * Gruppe im Bild und eine Murmel auf dem Brett, deren Farbe gerade nicht im Bild gewählt ist.
   */
  points(): {
    wood: { x: number; y: number };
    group: { x: number; y: number } | null;
    slot: { x: number; y: number } | null;
    /** ein freies Loch, in das eine Farbe vom Holzbrett gehört */
    trayHole: { x: number; y: number } | null;
  } | null {
    const game = this.game;
    if (!game) return null;
    const { level, state, selection } = game;
    const taken = selection?.source === 'board' ? new Set(selection.cells) : null;
    const group = components(level, state.cur)
      .groups.filter((g) => !taken?.has(g.cells[0]))
      .sort((a, b) => a.cells.length - b.cells.length)[0];
    const cell = group?.cells[0];
    const slot = state.tray.findIndex((c) => c >= 0 && !(selection?.source === 'board' && selection.color === c));
    const hole = level.cells.find((i) => state.cur[i] < 0 && state.tray.includes(level.target[i]));
    return {
      wood: this.view.clientPoint('ablage'),
      group: cell === undefined ? null : this.view.clientPoint({ cell }),
      slot: slot < 0 ? null : this.view.clientPoint({ slot }),
      trayHole: hole === undefined ? null : this.view.clientPoint({ cell: hole }),
    };
  }

  /** Wählt den Entwurf für leere Felder im Bild. */
  setHoleStyle(style: HoleStyle): void {
    this.view.setHoleStyle(style);
  }

  /** Stellt ein, wie schnell die Murmeln rollen. */
  setTempo(tempo: number): void {
    this.view.setTempo(tempo);
  }

  /** Wählt, ob die Murmeln spiegeln. */
  setMarbleStyle(style: MarbleStyle): void {
    this.view.setMarbleStyle(style);
  }

  /**
   * Stellt die Zahl der Mulden auf dem Holzbrett ein. Im laufenden Spiel gilt das sofort, außer es liegen mehr
   * Murmeln auf dem Brett, als das kleinere fassen würde: Dann bleibt es bis zum nächsten Bild beim alten.
   */
  setTraySize(size: number): boolean {
    this.traySize = size;
    const game = this.game;
    if (!game || game.solved || game.state.tray.length === size) return true;
    if (!game.resizeTray(size)) return false;
    this.view.calm();
    this.view.resize();
    this.save();
    this.updateUndo();
    return true;
  }

  /** Die Sprache hat gewechselt: Die Bildunterschrift steht auf der Zeichenfläche und wird neu geschrieben. */
  relabel(): void {
    if (this.picture) this.view.setTitle(this.picture.name);
  }

  /** Sagt einen Satz in der Leiste, der nach ein paar Sekunden wieder verschwindet. */
  tell(text: string): void {
    this.say(text);
  }

  /** Misst, wie viel Platz die Leiste oben und der Rand des Geräts unten brauchen. */
  private measure(): void {
    if (this.el.root.hidden) return;
    const top = this.el.bar.getBoundingClientRect().bottom - this.el.canvas.getBoundingClientRect().top;
    const bottom = Number.parseFloat(getComputedStyle(this.probe).paddingBottom) || 0;
    this.view.setInsets(Math.max(40, top), bottom);
  }

  private tap(clientX: number, clientY: number): void {
    const game = this.game;
    if (!game || game.solved) return;
    const hit = this.view.hit(clientX, clientY);
    const outcome =
      hit.type === 'cell' ? game.tapCell(hit.cell) : hit.type === 'tray' ? game.tapTray(hit.slot) : game.tapOutside();
    this.respond(outcome);
  }

  private respond(outcome: Outcome): void {
    switch (outcome.type) {
      case 'gewählt':
        this.sound.pick();
        this.view.refresh();
        if (outcome.hatLoch) this.hint('hint_hole');
        else this.hint('hint_tray');
        break;
      case 'ablage-gewählt':
        this.sound.pick();
        this.view.refresh();
        this.hint('hint_hole', 'brett');
        break;
      case 'abgewählt':
        this.view.refresh();
        break;
      case 'gerollt':
        this.view.roll(outcome.rolls);
        this.view.refresh();
        this.save();
        this.updateUndo();
        // Nicht alles passte ins Ziel: Der Rest bleibt gewählt und wartet auf das nächste Ziel.
        if (outcome.rest) this.hint('hint_rest');
        else if (outcome.ziel === 'ablage') this.hint('hint_pick_tray');
        break;
      case 'abgelehnt':
        this.sound.nope();
        if (outcome.reason === 'ablage-voll') {
          this.view.shake();
          this.say(t('say_tray_full'));
        } else if (outcome.reason === 'falsche-farbe') {
          this.say(t('say_wrong_color'));
        } else if (outcome.reason === 'nichts-gewählt') {
          this.say(t('say_pick_first'));
        }
        break;
      case 'liegt-richtig':
        this.view.glintCell(outcome.cell);
        break;
      case 'nichts':
        break;
    }
  }

  private undo(): void {
    if (!this.game?.undo()) return;
    this.settled.clear();
    this.view.calm();
    this.save();
    this.updateUndo();
  }

  private updateUndo(): void {
    this.el.undo.disabled = !this.game?.canUndo || this.game.solved;
  }

  /** Hält den Stand fest. Nach jedem Zug geschieht das von selbst. */
  save(): void {
    const { game, picture } = this;
    if (!game || !picture || game.solved) return;
    store.saveProgress(picture.key, { cur: Array.from(game.state.cur), tray: Array.from(game.state.tray) });
  }

  private finished(): void {
    const picture = this.picture;
    if (!picture) return;
    store.markFinished(picture.key);
    this.sound.finish();
    this.updateUndo();
    // dem fertigen Bild einen Moment allein lassen, dann erst die beiden Wege anbieten
    this.finishTimer = window.setTimeout(() => this.showFinish(), 2600);
  }

  /** Zeigt die beiden Wege nach dem Abschluss dort, wo vorher das Holzbrett lag. */
  private showFinish(): void {
    const zone = this.view.freeZone;
    const f = this.el.finish;
    f.style.left = `${zone.x}px`;
    f.style.top = `${zone.y}px`;
    f.style.width = `${zone.w}px`;
    f.style.height = `${zone.h}px`;
    f.hidden = false;
  }

  /**
   * Ein Hinweis, der nur die ersten beiden Male erscheint. Danach spielt man in Ruhe.
   * Gezählt wird je Anlass: Derselbe Satz kann zu zwei Anlässen gehören.
   */
  private hint(text: TextKey, occasion: string = text): void {
    this.told[occasion] = (this.told[occasion] ?? 0) + 1;
    if (this.told[occasion] <= 2) this.say(t(text));
  }

  private say(text: string): void {
    const w = this.el.whisper;
    w.textContent = text;
    w.classList.add('heard');
    clearTimeout(this.whisperTimer);
    this.whisperTimer = window.setTimeout(() => w.classList.remove('heard'), 3600);
  }
}
