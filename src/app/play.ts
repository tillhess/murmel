import type { HoleStyle } from '../art/holes';
import type { Sound } from '../audio/sound';
import { Game, type Outcome } from '../core/game';
import { colorDone, remaining } from '../core/grid';
import { newState } from '../core/level';
import { selectionSize, trayCount } from '../core/moves';
import { makeRng } from '../core/random';
import { suggest } from '../core/solver';
import type { Picture } from './library';
import { store } from './storage';
import { BoardView } from './view';

/** Mulden auf dem Holzbrett */
const TRAY_SLOTS = 30;

export interface PlayElements {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  bar: HTMLElement;
  back: HTMLButtonElement;
  undo: HTMLButtonElement;
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
    });
    this.probe.className = 'probe';
    el.root.append(this.probe);
    el.canvas.addEventListener('pointerdown', (e) => this.tap(e));
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
    const saved = fresh || picture.own ? undefined : store.progress(picture.id);
    if (!fresh && !picture.own && store.isFinished(picture.id) && !saved) {
      // schon fertig: das Bild zeigen, wie es ist
      this.game = new Game(level, newState(level.target.slice(), TRAY_SLOTS));
      window.setTimeout(() => this.showFinish(), 0);
    } else if (saved && saved.cur.length === level.target.length && saved.tray.length === TRAY_SLOTS) {
      this.game = new Game(level, { cur: Int16Array.from(saved.cur), tray: Int16Array.from(saved.tray) });
    } else {
      if (fresh) store.clearProgress(picture.id);
      this.game = Game.start(level, makeRng(Date.now() >>> 0), TRAY_SLOTS);
    }
    this.settled.clear();
    this.sound.setRoot(picture.mood.root);
    this.el.root.hidden = false;
    this.measure();
    this.view.show(this.game, picture.painting, picture.name);
    this.view.start();
    this.updateUndo();
    if (!this.game.solved) this.hint('anfang', 'Tippe auf eine Murmel.');
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
    if (game?.selection) {
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
    busy: boolean;
    finishShown: boolean;
  } | null {
    if (!this.game || !this.picture) return null;
    return {
      id: this.picture.id,
      solved: this.game.solved,
      remaining: remaining(this.game.level, this.game.state.cur),
      inTray: trayCount(this.game.state),
      selected: this.game.selection ? selectionSize(this.game.selection) : 0,
      busy: this.view.busy,
      finishShown: !this.el.finish.hidden,
    };
  }

  /** Wählt den Entwurf für leere Felder im Bild. */
  setHoleStyle(style: HoleStyle): void {
    this.view.setHoleStyle(style);
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

  private tap(e: PointerEvent): void {
    const game = this.game;
    if (!game || game.solved) return;
    const hit = this.view.hit(e.clientX, e.clientY);
    const outcome =
      hit.type === 'cell' ? game.tapCell(hit.cell) : hit.type === 'tray' ? game.tapTray(hit.slot) : game.tapOutside();
    this.respond(outcome);
  }

  private respond(outcome: Outcome): void {
    switch (outcome.type) {
      case 'gewählt':
        this.sound.pick();
        this.view.refresh();
        if (outcome.selection.source === 'board') {
          if (outcome.hatLoch) this.hint('loch', 'Tippe auf ein leuchtendes Loch.');
          else this.hint('ablage', 'Für diese Farbe ist noch kein Loch frei. Lege sie auf dem Holzbrett ab.');
        } else if (!outcome.hatLoch) {
          this.say('Für diese Farbe ist noch kein Loch frei.');
        }
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
        if (outcome.rest) this.hint('rest', 'Der Rest bleibt gewählt.');
        break;
      case 'abgelehnt':
        this.sound.nope();
        if (outcome.reason === 'ablage-voll') {
          this.view.shake();
          this.say('Das Holzbrett ist voll. Lege erst Murmeln von dort ins Bild.');
        } else if (outcome.reason === 'falsche-farbe') {
          this.say('In dieses Loch gehört eine andere Farbe.');
        } else if (outcome.reason === 'nichts-gewählt') {
          this.say('Tippe zuerst auf eine Murmel.');
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

  private save(): void {
    const { game, picture } = this;
    if (!game || !picture || picture.own || game.solved) return;
    store.saveProgress(picture.id, { cur: Array.from(game.state.cur), tray: Array.from(game.state.tray) });
  }

  private finished(): void {
    const picture = this.picture;
    if (!picture) return;
    if (!picture.own) store.markFinished(picture.id);
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

  /** Ein Hinweis, der nur die ersten beiden Male erscheint. Danach spielt man in Ruhe. */
  private hint(key: string, text: string): void {
    this.told[key] = (this.told[key] ?? 0) + 1;
    if (this.told[key] <= 2) this.say(text);
  }

  private say(text: string): void {
    const w = this.el.whisper;
    w.textContent = text;
    w.classList.add('heard');
    clearTimeout(this.whisperTimer);
    this.whisperTimer = window.setTimeout(() => w.classList.remove('heard'), 3600);
  }
}
