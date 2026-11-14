import { HOLE_STYLES, type HoleStyle, hole, holeVariants, showsPicture } from '../art/holes';
import {
  dimple,
  glint,
  MARBLE_STYLES,
  type MarbleStyle,
  marble,
  marbleCore,
  marbleTop,
  marbleUnder,
} from '../art/marble';
import { PAPER, paperSheet, roundedRect, WOOD, woodBoard } from '../art/materials';
import { newCanvas } from '../art/paint';
import {
  type Camera,
  clampCamera,
  type Frame,
  panBy,
  pinchTo,
  toPicture,
  visible,
  WHOLE,
  zoomAt,
} from '../core/camera';
import { type Pt, type Run, runDuration, runPosition, scheduleChain } from '../core/chain';
import type { Game } from '../core/game';
import { EMPTY } from '../core/level';
import type { Roll, Spot } from '../core/moves';
import { type Sprite, Sprites } from './sprites';
import { DISPLAY_FONT } from './theme';

const VARIANTS = 6;
/** Rolltempo in Feldern pro Sekunde: ruhig genug zum Zusehen. Weiterspielen kann man, während die Kette noch rollt. */
const SPEED = 13;
/** Auf dem letzten Stück vor ihrem Ziel rollt eine Murmel aus (in Feldern). */
const EASE_CELLS = 0.8;
/** So lange sinken gewählte Murmeln zurück auf das Papier, bevor sie losrollen */
const SETTLE_MS = 130;
/** Ein Atemzug der Auswahl: Ringe und leuchtende Löcher schwellen in vier Sekunden an und ab */
const PULSE_MS = 4000;
/** So lange braucht eine eingerastete Murmel, um im Bild aufzugehen */
const BLOOM_MS = 620;
/** Vergrößern lässt sich das Bild, bis ein Feld etwa so groß ist (Bildschirmpunkte), mindestens aber aufs Doppelte */
const ZOOM_CELL = 60;
const LIGHT = '#fff8ea';
const INK = '#1b1d30';

export type Hit = { type: 'cell'; cell: number } | { type: 'tray'; slot: number | null } | { type: 'outside' };

export interface ViewHooks {
  /** Eine Murmel ist an ihrem Ziel angekommen. `rank` zählt die Ankünfte innerhalb der Kette ab 0. */
  land(spot: Spot, color: number, rank: number, total: number): void;
  /** Das Bild ist fertig und alles zur Ruhe gekommen. */
  finished(): void;
  /** Das Bild ist jetzt vergrößert (true) oder wieder ganz zu sehen (false). */
  zoomed(on: boolean): void;
}

interface Flight {
  color: number;
  run: Run;
  t0: number;
  speed: number;
  dest: Spot;
  /** gemeinsamer Zähler aller Murmeln dieses Zugs: wie viele schon angekommen sind */
  chain: { landed: number; total: number };
  fromSlot: boolean;
  /** so hoch schwebte die Murmel als Teil der Auswahl (Pixel) */
  lift: number;
  turn: number;
}

interface Twinkle {
  x: number;
  y: number;
  size: number;
  t0: number;
  dur: number;
}

/**
 * Zeichnet das Spielbrett: ein Blatt Papier mit dem Bild, darunter das Holzbrett der Ablage.
 * Zwei Ebenen: eine zwischengespeicherte Grundebene (Papier, Bild, Mulden, liegende Murmeln), die nur nach einer
 * Änderung neu entsteht, und darüber in jedem Bild nur das Bewegte (Auswahl, rollende Murmeln, Lichter).
 *
 * Das Bild lässt sich vergrößern und verschieben. Der Papierrahmen ist dabei ein Fenster: Er und das Holzbrett
 * bleiben, wo sie sind, nur der Inhalt des Fensters bewegt sich. Alle Maße des Bildes (Feldmitten, Wege der
 * Murmeln) gelten für das unvergrößerte Bild; erst beim Zeichnen kommt der Ausschnitt dazu.
 */
export class BoardView {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly base = newCanvas(1, 1);
  private readonly bctx: CanvasRenderingContext2D;
  private readonly mask = newCanvas(4, 4);
  private readonly sprites = new Sprites();
  private readonly reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Wie ein leeres Feld im Bild aussieht (siehe src/art/holes.ts) */
  private holeStyle: HoleStyle = HOLE_STYLES[0];
  /** Murmeln mit oder ohne Spiegelung (siehe src/art/marble.ts) */
  private marbleStyle: MarbleStyle = MARBLE_STYLES[0];

  private game: Game | null = null;
  private painting: HTMLCanvasElement | null = null;
  private title = '';

  private dpr = 1;
  private W = 0;
  private H = 0;
  private cell = 10;
  private ox = 0;
  private oy = 0;
  private paper = { x: 0, y: 0, w: 0, h: 0, bottom: 0 };
  private tray = { x: 0, y: 0, w: 0, h: 0, slot: 30, cols: 15, rows: 2, side: false };
  private zone = { x: 0, y: 0, w: 0, h: 0 };
  /** Platz, den oben die Leiste und unten der Rand des Geräts brauchen */
  private inset = { top: 56, bottom: 0 };

  /** Ausschnitt des Bildes, den man gerade sieht */
  private cam: Camera = WHOLE;
  /** In dieser Vergrößerung sind die Murmeln gerade vorgezeichnet (nach einer Geste nachgeschärft) */
  private crisp = 1;

  private staticBg: HTMLCanvasElement | null = null;
  private paintLayer: HTMLCanvasElement | null = null;
  private trayBg: HTMLCanvasElement | null = null;
  private baseDirty = true;
  private staticDirty = true;

  private flights: Flight[] = [];
  private blooms = new Map<number, { t0: number; color: number }>();
  private twinkles: Twinkle[] = [];
  private pendCells = new Set<number>();
  private pendSlots = new Set<number>();
  private lastTwinkle = 0;
  private shakeAt = -1e9;
  private finishedAt = 0;
  private raf = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hooks: ViewHooks,
  ) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.bctx = this.base.getContext('2d') as CanvasRenderingContext2D;
  }

  // ---------- von außen ----------

  /** Zeigt ein Spiel. `painting` ist das fertig gemalte Bild in hoher Auflösung. */
  show(game: Game, painting: HTMLCanvasElement, title: string): void {
    this.game = game;
    this.painting = painting;
    this.title = title;
    this.calm();
    this.finishedAt = game.solved ? -1 : 0;
    this.cam = WHOLE;
    this.crisp = 1;
    this.hooks.zoomed(false);
    this.resize();
  }

  /** Bricht alle laufenden Bewegungen ab (z. B. nach "Rückgängig"). */
  calm(): void {
    this.flights = [];
    this.blooms.clear();
    this.twinkles = [];
    this.pendCells.clear();
    this.pendSlots.clear();
    this.baseDirty = true;
  }

  /** Spielstand oder Auswahl haben sich geändert. */
  refresh(): void {
    this.baseDirty = true;
  }

  /** Schrift oder Farben haben sich geändert: auch Papier und Unterschrift neu zeichnen. */
  redraw(): void {
    this.staticDirty = true;
    this.baseDirty = true;
  }

  /** Wo ein Feld, eine Mulde oder das Holzbrett auf dem Bildschirm liegt (für Tests, die wie ein Mensch tippen). */
  clientPoint(spot: Spot | 'ablage'): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const t = this.tray;
    const [x, y] =
      spot === 'ablage'
        ? [t.x + t.w / 2, t.y + 6]
        : 'cell' in spot
          ? this.toView(this.cellCenter(spot.cell))
          : this.slotCenter(spot.slot);
    return { x: rect.left + x, y: rect.top + y };
  }

  // ---------- Vergrößern und Verschieben ----------

  /** Wie stark das Bild gerade vergrößert ist (1 = ganz zu sehen). */
  get zoom(): number {
    return this.cam.zoom;
  }

  get zoomed(): boolean {
    return this.cam.zoom > 1.001;
  }

  /** Kantenlänge eines Felds im unvergrößerten Bild (Bildschirmpunkte). */
  get cellSize(): number {
    return this.cell;
  }

  /** Liegt der Punkt im Bildrahmen? Nur dort beginnt Vergrößern oder Verschieben. */
  inPicture(clientX: number, clientY: number): boolean {
    const rect = this.canvas.getBoundingClientRect();
    return this.inFrame([clientX - rect.left, clientY - rect.top]);
  }

  /** Vergrößert um den Faktor `factor`; der Punkt unter (clientX, clientY) bleibt an seiner Stelle. */
  zoomAt(factor: number, clientX: number, clientY: number): void {
    if (this.finishedAt !== 0 || !this.game) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left - this.ox;
    const sy = clientY - rect.top - this.oy;
    this.setCamera(zoomAt(this.cam, factor, sx, sy, this.frameSize(), this.maxZoom()));
  }

  /** Zwei Finger: Ihr Mittelpunkt wandert von der einen Stelle zur anderen, ihr Abstand wächst um `factor`. */
  pinch(factor: number, fromX: number, fromY: number, toX: number, toY: number): void {
    if (this.finishedAt !== 0 || !this.game) return;
    const rect = this.canvas.getBoundingClientRect();
    const left = rect.left + this.ox;
    const top = rect.top + this.oy;
    this.setCamera(
      pinchTo(this.cam, factor, fromX - left, fromY - top, toX - left, toY - top, this.frameSize(), this.maxZoom()),
    );
  }

  /** Verschiebt das vergrößerte Bild um (dx, dy) Bildschirmpunkte. */
  panBy(dx: number, dy: number): void {
    if (this.finishedAt !== 0 || !this.game) return;
    this.setCamera(panBy(this.cam, dx, dy, this.frameSize(), this.maxZoom()));
  }

  /** Zeigt wieder das ganze Bild. */
  resetZoom(): void {
    this.setCamera(WHOLE);
    this.settle();
  }

  /**
   * Nach einer Geste: Die Murmeln werden in der neuen Größe frisch vorgezeichnet, damit sie scharf sind.
   * Währenddessen wäre das zu teuer, da werden die vorhandenen Bildchen nur gestreckt.
   */
  settle(): void {
    const crisp = Math.min(4, Math.ceil(this.cam.zoom * 2) / 2);
    if (crisp === this.crisp) return;
    this.crisp = crisp;
    this.sprites.dpr = this.dpr * crisp;
    this.sprites.clear();
    this.baseDirty = true;
  }

  private setCamera(cam: Camera): void {
    const was = this.zoomed;
    if (cam.zoom === this.cam.zoom && cam.x === this.cam.x && cam.y === this.cam.y) return;
    this.cam = cam;
    this.baseDirty = true;
    if (was !== this.zoomed) this.hooks.zoomed(this.zoomed);
  }

  private frameSize(): Frame {
    const level = this.game?.level;
    return { w: (level?.w ?? 1) * this.cell, h: (level?.h ?? 1) * this.cell };
  }

  private maxZoom(): number {
    return Math.max(2, ZOOM_CELL / this.cell);
  }

  /** Liegt ein Punkt des unvergrößerten Bildes im Bildrahmen? (Mulden des Holzbretts liegen immer außerhalb.) */
  private inFrame(p: Pt): boolean {
    const { w, h } = this.frameSize();
    return p[0] >= this.ox - 0.5 && p[1] >= this.oy - 0.5 && p[0] <= this.ox + w + 0.5 && p[1] <= this.oy + h + 0.5;
  }

  /** Wo ein Punkt des unvergrößerten Bildes gerade auf der Zeichenfläche erscheint. */
  private toView(p: Pt): Pt {
    const { zoom, x, y } = this.cam;
    return [this.ox + (p[0] - this.ox) * zoom - x, this.oy + (p[1] - this.oy) * zoom - y];
  }

  /** Zieht einen Punkt auf den Rand des Bildrahmens, falls er außerhalb liegt. */
  private toFrameEdge(p: Pt): Pt {
    const { w, h } = this.frameSize();
    return [Math.max(this.ox, Math.min(this.ox + w, p[0])), Math.max(this.oy, Math.min(this.oy + h, p[1]))];
  }

  /** Begrenzt das Zeichnen auf den Bildrahmen und legt den Ausschnitt darüber: Danach gelten die Maße des Bildes. */
  private applyCamera(x: CanvasRenderingContext2D): void {
    const { w, h } = this.frameSize();
    x.beginPath();
    x.rect(this.ox, this.oy, w, h);
    x.clip();
    x.translate(this.ox - this.cam.x, this.oy - this.cam.y);
    x.scale(this.cam.zoom, this.cam.zoom);
    x.translate(-this.ox, -this.oy);
  }

  /** Welche Spalten und Zeilen gerade im Rahmen liegen (mit einem Feld Zugabe für Schatten und Schwebendes). */
  private visibleCells(): { gx0: number; gy0: number; gx1: number; gy1: number } {
    const level = (this.game as Game).level;
    const v = visible(this.cam, this.frameSize());
    return {
      gx0: Math.max(0, Math.floor(v.x / this.cell) - 1),
      gy0: Math.max(0, Math.floor(v.y / this.cell) - 1),
      gx1: Math.min(level.w - 1, Math.ceil((v.x + v.w) / this.cell)),
      gy1: Math.min(level.h - 1, Math.ceil((v.y + v.h) / this.cell)),
    };
  }

  /** Der freie Bereich neben bzw. unter dem Blatt (CSS-Pixel relativ zur Zeichenfläche). */
  get freeZone(): { x: number; y: number; w: number; h: number } {
    return this.zone;
  }

  get busy(): boolean {
    return this.flights.length > 0 || this.blooms.size > 0;
  }

  /** Wählt den Entwurf für leere Felder im Bild. */
  setHoleStyle(style: HoleStyle): void {
    if (style === this.holeStyle) return;
    this.holeStyle = style;
    this.baseDirty = true;
  }

  /** Wählt, ob die Murmeln spiegeln. */
  setMarbleStyle(style: MarbleStyle): void {
    if (style === this.marbleStyle) return;
    this.marbleStyle = style;
    this.sprites.clear();
    this.baseDirty = true;
  }

  /** Wie viel Platz oben (Leiste, Statusleiste) und unten (Rand des Geräts) frei bleiben muss. */
  setInsets(top: number, bottom: number): void {
    if (Math.abs(top - this.inset.top) < 0.5 && Math.abs(bottom - this.inset.bottom) < 0.5) return;
    this.inset = { top, bottom };
    this.resize();
  }

  start(): void {
    if (this.raf) return;
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.W = rect.width;
    this.H = rect.height;
    this.canvas.width = Math.max(1, Math.round(this.W * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.H * this.dpr));
    this.base.width = this.canvas.width;
    this.base.height = this.canvas.height;
    this.sprites.dpr = this.dpr * this.crisp;
    this.sprites.clear();
    this.trayBg = null;
    this.staticDirty = true;
    this.baseDirty = true;
    const game = this.game;
    if (!game || this.W < 10 || this.H < 10) return;

    const { w, h } = game.level;
    const slots = game.state.tray.length;
    const { W, H } = this;
    const { top, bottom } = this.inset;
    // Im Querformat liegt das Holzbrett rechts neben dem Bild, im Hochformat darunter: So bleibt das Bild groß.
    const side = W > H * 1.2 && W >= 700;
    // Ein großes Holzbrett bekommt kleinere Mulden, damit dem Bild Platz bleibt.
    const widest = slots <= 30 ? 44 : slots <= 60 ? 38 : slots <= 90 ? 32 : 28;
    const slot = Math.max(22, Math.min(widest, side ? H / 17 : Math.min(W / 17, H / 22)));
    let cols: number;
    let rows: number;
    if (side) {
      const perColumn = Math.max(5, Math.min(slots, Math.floor((H - top - bottom - 60) / slot)));
      cols = Math.ceil(slots / perColumn);
      rows = Math.ceil(slots / cols);
    } else {
      const perRow = Math.max(5, Math.min(slots, Math.floor((Math.min(W, 880) - 40) / slot)));
      rows = Math.ceil(slots / perRow);
      cols = Math.ceil(slots / rows);
    }
    const trayW = cols * slot + 26;
    const trayH = rows * slot + 26;
    // Platz für das Blatt
    const areaW = side ? W - trayW - 64 : W - 28;
    const areaH = side ? H - top - bottom - 22 : H - top - bottom - trayH - 44;
    // Das Blatt hat ringsum einen Papierrand und unten einen breiteren für die Bildunterschrift.
    const cell = Math.max(4, Math.floor(Math.min(areaW / (w + 1.6), areaH / (h + 2.9))));
    const m = Math.round(cell * 0.8);
    const mb = Math.round(cell * 2.1);
    const pw = w * cell + 2 * m;
    const ph = h * cell + m + mb;
    const gap = side ? Math.max(0, (W - pw - trayW - 30) / 2) : 0;
    const px = side ? Math.round(gap) : Math.round((W - pw) / 2);
    const py = Math.round(top + (areaH - ph) / 2);
    this.cell = cell;
    this.ox = px + m;
    this.oy = py + m;
    this.paper = { x: px, y: py, w: pw, h: ph, bottom: mb };
    this.tray = side
      ? {
          x: Math.round(px + pw + 30),
          y: Math.round(top + (areaH - trayH) / 2),
          w: trayW,
          h: trayH,
          slot,
          cols,
          rows,
          side,
        }
      : {
          x: Math.round((W - trayW) / 2),
          y: Math.round(H - bottom - trayH - 18),
          w: trayW,
          h: trayH,
          slot,
          cols,
          rows,
          side,
        };
    // Der Bereich neben bzw. unter dem Blatt: Dort steht nach dem Abschluss, wie es weitergeht.
    this.zone = side
      ? { x: px + pw + 12, y: top, w: W - (px + pw + 12) - 8, h: H - top - bottom - 8 }
      : { x: 8, y: py + ph + 10, w: W - 16, h: H - bottom - (py + ph + 10) - 8 };
    // Murmeln rollen von der Seite des Bildes los, die dem Holzbrett am nächsten liegt.
    game.trayAt = side ? [w + 1, (h - 1) / 2] : [(w - 1) / 2, h + 1];
    this.paintLayer = newCanvas(Math.round(w * cell * this.dpr), Math.round(h * cell * this.dpr));
    const was = this.zoomed;
    this.cam = clampCamera(this.cam, this.frameSize(), this.maxZoom());
    if (was !== this.zoomed) this.hooks.zoomed(this.zoomed);
  }

  hit(clientX: number, clientY: number): Hit {
    const game = this.game;
    if (!game) return { type: 'outside' };
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const t = this.tray;
    if (x >= t.x - 6 && x <= t.x + t.w + 6 && y >= t.y - 6 && y <= t.y + t.h + 6) {
      for (let k = 0; k < game.state.tray.length; k++) {
        const [sx, sy] = this.slotCenter(k);
        if (Math.hypot(x - sx, y - sy) < t.slot * 0.55) return { type: 'tray', slot: k };
      }
      return { type: 'tray', slot: null };
    }
    // im Bildrahmen: Welches Feld liegt unter dem Finger, wenn man den Ausschnitt herausrechnet?
    if (!this.inFrame([x, y])) return { type: 'outside' };
    const [px, py] = toPicture(this.cam, x - this.ox, y - this.oy);
    const gx = Math.floor(px / this.cell);
    const gy = Math.floor(py / this.cell);
    const { w, h, target } = game.level;
    if (gx < 0 || gy < 0 || gx >= w || gy >= h || target[gy * w + gx] < 0) return { type: 'outside' };
    return { type: 'cell', cell: gy * w + gx };
  }

  /** Lässt die Murmeln eines Zugs als Kette rollen. Der Spielstand ist dabei schon der neue. */
  roll(rolls: readonly Roll[]): void {
    if (!rolls.length) return;
    const now = performance.now();
    const point = (s: Spot): Pt => ('cell' in s ? this.cellCenter(s.cell) : this.slotCenter(s.slot));
    const paths = rolls.map((r) => [point(r.from), ...r.via.map(point)]);
    const spacing = this.marbleD() * 1.08;
    const far = Math.max(...paths.map((p) => Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1])));
    // lange Wege und lange Ketten etwas schneller, damit kein Zug ewig dauert
    const speed = this.reduceMotion
      ? 1e6
      : Math.max((this.cell * SPEED) / 1000, far / 1300, (spacing * (rolls.length - 1)) / 2800);
    const runs = scheduleChain(paths, { speed, spacing, ease: this.cell * EASE_CELLS });
    const chain = { landed: 0, total: rolls.length };
    rolls.forEach((r, k) => {
      const from = r.from;
      this.flights.push({
        color: r.color,
        run: runs[k],
        t0: now,
        speed,
        dest: r.to,
        chain,
        fromSlot: 'slot' in from,
        lift: 'slot' in from ? 5 : this.cell * 0.13,
        turn: this.turnOf('cell' in from ? from.cell * 7 : from.slot),
      });
      if ('cell' in r.to) this.pendCells.add(r.to.cell);
      else this.pendSlots.add(r.to.slot);
    });
    this.baseDirty = true;
  }

  /** Das Holzbrett wiegt sich einmal sacht hin und her: Hier ist kein Platz mehr. */
  shake(): void {
    this.shakeAt = performance.now();
  }

  /** Kleiner Lichtschein auf einem Feld, das schon fertig ist. */
  glintCell(cell: number): void {
    if (this.reduceMotion) return;
    const [x, y] = this.cellCenter(cell);
    this.twinkles.push({ x, y, size: this.cell * 0.9, t0: performance.now(), dur: 520 });
  }

  // ---------- Geometrie ----------

  private cellCenter(i: number): Pt {
    const w = this.game?.level.w ?? 1;
    return [this.ox + ((i % w) + 0.5) * this.cell, this.oy + (Math.floor(i / w) + 0.5) * this.cell];
  }

  private slotCenter(k: number): Pt {
    const t = this.tray;
    // seitlich füllt sich das Brett spaltenweise von oben, unten zeilenweise von links
    const col = t.side ? Math.floor(k / t.rows) : k % t.cols;
    const row = t.side ? k % t.rows : Math.floor(k / t.cols);
    return [t.x + 13 + (col + 0.5) * t.slot, t.y + 13 + (row + 0.5) * t.slot];
  }

  private marbleD(): number {
    return Math.round(this.cell * 0.82);
  }

  private trayD(): number {
    return Math.round(this.tray.slot * 0.8);
  }

  private turnOf(n: number): number {
    return ((n % VARIANTS) * Math.PI * 2) / VARIANTS;
  }

  /** Zeigt dieses Feld schon das Bild? (Die Murmel liegt richtig und ist fertig eingerollt und aufgegangen.) */
  private shown(i: number): boolean {
    const game = this.game as Game;
    return game.state.cur[i] === game.level.target[i] && !this.pendCells.has(i) && !this.blooms.has(i);
  }

  // ---------- Bildchen ----------

  private marbleSprite(color: string, d: number, variant: number): Sprite {
    const style = this.marbleStyle;
    return this.sprites.get(`m${style}${color}${variant}`, d, (x, D) =>
      marble(x, D / 2, D / 2, (D / 2) * 0.96, color, this.turnOf(variant), style),
    );
  }

  private layerSprite(layer: 'u' | 'c' | 't', color: string, d: number): Sprite {
    const draw = layer === 'u' ? marbleUnder : layer === 'c' ? marbleCore : marbleTop;
    const style = this.marbleStyle;
    return this.sprites.get(`${layer}${style}${color}`, d, (x, D) =>
      draw(x, D / 2, D / 2, (D / 2) * 0.96, color, style),
    );
  }

  /** Leeres Feld i im Bild, in der Farbe, die hierher gehört. Manche Entwürfe haben mehrere Formen. */
  private holeSprite(color: string, cell: number, i: number): Sprite {
    const style = this.holeStyle;
    const variant = (i * 7) % holeVariants(style);
    return this.sprites.get(`h${style}${variant}${color}`, cell, (x, D) =>
      hole(x, D / 2, D / 2, D, color, style, variant),
    );
  }

  /** Mulde im Holzbrett */
  private dimpleSprite(color: string, d: number): Sprite {
    return this.sprites.get(`d${color}`, d, (x, D) => dimple(x, D / 2, D / 2, D * 0.37, color));
  }

  // ---------- Grundebene ----------

  private buildStatic(): void {
    const game = this.game as Game;
    const { h } = game.level;
    const { cell, dpr, oy, paper } = this;

    this.staticBg = newCanvas(this.canvas.width, this.canvas.height);
    const x = this.staticBg.getContext('2d') as CanvasRenderingContext2D;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    paperSheet(x, paper.x, paper.y, paper.w, paper.h, dpr);
    // Bildunterschrift auf dem unteren Papierrand, wie bei einem Druck
    const size = Math.max(12, Math.min(22, cell * 0.66));
    x.font = `italic 500 ${size}px ${DISPLAY_FONT}`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = 'rgba(43,39,51,0.78)';
    x.fillText(this.title, paper.x + paper.w / 2, oy + h * cell + paper.bottom * 0.52);
    this.staticDirty = false;
  }

  private rebuildBase(): void {
    const game = this.game;
    const painting = this.painting;
    if (!game || !painting) return;
    if (this.staticDirty || !this.staticBg) this.buildStatic();
    const { level, state } = game;
    const { w, h } = level;
    const { cell, dpr, ox, oy } = this;
    const g = this.bctx;
    const frame = this.frameSize();

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.base.width, this.base.height);
    g.drawImage(this.staticBg as HTMLCanvasElement, 0, 0);

    // Der Bildrahmen ist ein Fenster: Gezeichnet wird nur der Teil des Gemäldes, der gerade darin liegt.
    const view = visible(this.cam, frame);
    const kx = painting.width / frame.w;
    const ky = painting.height / frame.h;
    const sx = view.x * kx;
    const sy = view.y * ky;
    const sw = view.w * kx;
    const sh = view.h * ky;

    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.beginPath();
    g.rect(ox, oy, frame.w, frame.h);
    g.clip();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (this.finishedAt !== 0) {
      // fertig: nur noch das Bild
      g.drawImage(painting, sx, sy, sw, sh, ox, oy, frame.w, frame.h);
    } else {
      // Vorzeichnung: das Bild ganz blass auf dem Papier. So ahnt man von Anfang an, was entsteht.
      g.fillStyle = PAPER;
      g.fillRect(ox, oy, frame.w, frame.h);
      g.globalAlpha = 0.36;
      g.drawImage(painting, sx, sy, sw, sh, ox, oy, frame.w, frame.h);
      g.globalAlpha = 1;
      // Fertige Flächen: das Bild scheint durch eine weich gezeichnete Maske. Bei manchen Entwürfen für leere
      // Felder liegt das Bild auch dort schon offen, wo noch eine Murmel fehlt: Dann ist nur das Loch zu sehen.
      const open = showsPicture(this.holeStyle);
      const mw = w * 4;
      const mh = h * 4;
      if (this.mask.width !== mw || this.mask.height !== mh) {
        this.mask.width = mw;
        this.mask.height = mh;
      }
      const m = this.mask.getContext('2d') as CanvasRenderingContext2D;
      m.clearRect(0, 0, mw, mh);
      m.fillStyle = '#ffffff';
      let any = false;
      for (const i of level.cells) {
        const free = open && (state.cur[i] === EMPTY || this.pendCells.has(i) || this.blooms.has(i));
        if (!free && !this.shown(i)) continue;
        any = true;
        m.fillRect((i % w) * 4, Math.floor(i / w) * 4, 4, 4);
      }
      const layer = this.paintLayer;
      if (any && layer) {
        const p = layer.getContext('2d') as CanvasRenderingContext2D;
        p.imageSmoothingEnabled = true;
        p.imageSmoothingQuality = 'high';
        p.globalCompositeOperation = 'copy';
        p.drawImage(painting, sx, sy, sw, sh, 0, 0, layer.width, layer.height);
        p.globalCompositeOperation = 'destination-in';
        p.drawImage(
          this.mask,
          (view.x / frame.w) * mw,
          (view.y / frame.h) * mh,
          (view.w / frame.w) * mw,
          (view.h / frame.h) * mh,
          0,
          0,
          layer.width,
          layer.height,
        );
        p.globalCompositeOperation = 'source-over';
        g.drawImage(layer, ox, oy, frame.w, frame.h);
      }

      // Leere Felder und liegende Murmeln, soweit sie im Fenster liegen
      g.translate(ox - this.cam.x, oy - this.cam.y);
      g.scale(this.cam.zoom, this.cam.zoom);
      g.translate(-ox, -oy);
      const sel = game.selection;
      const lifted = sel?.source === 'board' ? new Set(sel.cells) : null;
      const md = this.marbleD();
      const { gx0, gy0, gx1, gy1 } = this.visibleCells();
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const i = gy * w + gx;
          if (level.target[i] < 0 || this.shown(i) || this.blooms.has(i)) continue;
          const [cx, cy] = this.cellCenter(i);
          const c = state.cur[i];
          if (c === EMPTY || this.pendCells.has(i) || lifted?.has(i)) {
            Sprites.blit(g, this.holeSprite(level.palette[level.target[i]], cell, i), cx, cy, cell);
          } else {
            Sprites.blit(g, this.marbleSprite(level.palette[c], md, (i * 7) % VARIANTS), cx, cy, md);
          }
        }
      }
    }
    g.restore();

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // feine Kante um das Bild, wie der Plattenrand eines Drucks
    g.strokeStyle = 'rgba(40,34,30,0.16)';
    g.lineWidth = 1;
    g.strokeRect(ox - 0.5, oy - 0.5, frame.w + 1, frame.h + 1);
  }

  private buildTray(): void {
    const game = this.game as Game;
    const t = this.tray;
    const M = 26;
    this.trayBg = newCanvas((t.w + 2 * M) * this.dpr, (t.h + 2 * M) * this.dpr);
    const x = this.trayBg.getContext('2d') as CanvasRenderingContext2D;
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.translate(M, M);
    woodBoard(x, t.w, t.h, this.dpr);
    for (let k = 0; k < game.state.tray.length; k++) {
      const [sx, sy] = this.slotCenter(k);
      Sprites.blit(x, this.dimpleSprite(WOOD, t.slot), sx - t.x, sy - t.y, t.slot);
    }
  }

  // ---------- jedes Bild ----------

  private frame(now: number): void {
    const game = this.game;
    if (!game || !this.painting || this.W < 10) return;

    for (let f = this.flights.length - 1; f >= 0; f--) {
      const fl = this.flights[f];
      if (now - fl.t0 - fl.run.start >= runDuration(fl.run, fl.speed)) {
        this.flights.splice(f, 1);
        this.land(fl, now);
      }
    }
    for (const [cell, b] of this.blooms) {
      if (now - b.t0 >= BLOOM_MS) {
        this.blooms.delete(cell);
        this.baseDirty = true;
      }
    }
    if (this.finishedAt === 0 && game.solved && !this.busy) {
      this.finishedAt = now;
      this.baseDirty = true;
      // Das fertige Bild soll ganz zu sehen sein.
      this.resetZoom();
      this.hooks.finished();
    }
    if (this.baseDirty) {
      this.rebuildBase();
      this.baseDirty = false;
    }
    this.spawnTwinkle(now);
    this.draw(now);
  }

  private land(fl: Flight, now: number): void {
    const game = this.game as Game;
    if ('cell' in fl.dest) {
      const cell = fl.dest.cell;
      this.pendCells.delete(cell);
      if (!this.reduceMotion && game.state.cur[cell] === game.level.target[cell]) {
        this.blooms.set(cell, { t0: now, color: fl.color });
      }
    } else {
      this.pendSlots.delete(fl.dest.slot);
    }
    this.baseDirty = true;
    this.hooks.land(fl.dest, fl.color, fl.chain.landed++, fl.chain.total);
  }

  private spawnTwinkle(now: number): void {
    const game = this.game as Game;
    // Ab und zu wandert ein Licht über eine Murmel: langsam und einzeln, es soll nicht glitzern.
    // Matte Murmeln spiegeln nichts, also auch kein Licht.
    if (this.marbleStyle === 'matt' || this.reduceMotion || this.finishedAt !== 0) return;
    if (now - this.lastTwinkle < 1500 || this.twinkles.length >= 2) return;
    this.lastTwinkle = now;
    const { level, state } = game;
    for (let tries = 0; tries < 6; tries++) {
      const i = level.cells[Math.floor(Math.random() * level.cells.length)];
      if (state.cur[i] === EMPTY || this.pendCells.has(i) || state.cur[i] === level.target[i]) continue;
      const [x, y] = this.cellCenter(i);
      this.twinkles.push({
        x: x - this.cell * 0.16,
        y: y - this.cell * 0.2,
        size: this.cell * 0.55,
        t0: now,
        dur: 2200 + Math.random() * 1200,
      });
      return;
    }
  }

  private draw(now: number): void {
    const game = this.game as Game;
    const painting = this.painting as HTMLCanvasElement;
    const { level, state } = game;
    const { ctx, cell, dpr } = this;
    const zoom = this.cam.zoom;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pulse = this.reduceMotion ? 0.6 : 0.5 + 0.5 * Math.sin((now / PULSE_MS) * Math.PI * 2);
    const sel = this.finishedAt === 0 ? game.selection : null;
    const md = this.marbleD();
    const td = this.trayD();
    const { gx0, gy0, gx1, gy1 } = this.visibleCells();
    const inView = (i: number): boolean => {
      const gx = i % level.w;
      const gy = Math.floor(i / level.w);
      return gx >= gx0 && gx <= gx1 && gy >= gy0 && gy <= gy1;
    };

    // Wer rollt gerade wo? Im Bild gilt der Ausschnitt, zwischen Bild und Holzbrett nicht.
    const inside: { fl: Flight; pos: ReturnType<typeof runPosition> }[] = [];
    const between: { fl: Flight; pos: ReturnType<typeof runPosition> }[] = [];
    for (const fl of this.flights) {
      const pos = runPosition(fl.run, now - fl.t0, fl.speed);
      (this.inFrame(pos.from) && this.inFrame(pos.to) ? inside : between).push({ fl, pos });
    }
    const rollingMarble = (color: string, x: number, y: number, size: number, turn: number): void => {
      Sprites.blit(ctx, this.layerSprite('u', color, md), x, y, size);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(turn);
      Sprites.blit(ctx, this.layerSprite('c', color, md), 0, 0, size);
      ctx.restore();
      Sprites.blit(ctx, this.layerSprite('t', color, md), x, y, size);
    };

    // ---------- im Bildrahmen ----------
    ctx.save();
    this.applyCamera(ctx);

    // Auswahl: passende Mulden leuchten ruhig auf, gewählte Murmeln schweben über ihren Mulden
    // Ist nichts im Bild gewählt, sind die Murmeln auf dem Holzbrett am Zug: Dann leuchten die Löcher all ihrer Farben.
    const trayActive = this.finishedAt === 0 && game.trayActive;
    const glow = sel ? new Set([sel.color]) : trayActive ? new Set(state.tray) : null;
    if (glow) {
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const i = gy * level.w + gx;
          if (state.cur[i] !== EMPTY || !glow.has(level.target[i]) || this.pendCells.has(i)) continue;
          const [x, y] = this.cellCenter(i);
          ctx.beginPath();
          ctx.arc(x, y, cell * 0.43, 0, Math.PI * 2);
          ctx.strokeStyle = LIGHT;
          ctx.globalAlpha = 0.55 + 0.4 * pulse;
          ctx.lineWidth = Math.max(1.6, cell * 0.11);
          ctx.stroke();
          ctx.strokeStyle = INK;
          ctx.globalAlpha = 0.3 + 0.2 * pulse;
          ctx.lineWidth = Math.max(0.8, cell * 0.035);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (sel?.source === 'board') {
        const d = Math.round(cell * 0.88);
        const lift = cell * 0.13 + pulse * cell * 0.03;
        for (const i of sel.cells) {
          if (!inView(i)) continue;
          const [x, y] = this.cellCenter(i);
          Sprites.blit(ctx, this.marbleSprite(level.palette[sel.color], d, (i * 7) % VARIANTS), x, y - lift, d);
          // heller Ring: so ist auf einen Blick klar, was gewählt ist
          ctx.beginPath();
          ctx.arc(x, y - lift, d * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = LIGHT;
          ctx.globalAlpha = 0.75 + 0.25 * pulse;
          ctx.lineWidth = Math.max(1.4, cell * 0.06);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Murmeln, die gerade eingerastet sind, gehen im Bild auf: das Bild wächst aus der Mitte des Felds
    for (const [i, b] of this.blooms) {
      if (!inView(i)) continue;
      const p = Math.min(1, (now - b.t0) / BLOOM_MS);
      const ease = 1 - (1 - p) ** 3;
      const [cx, cy] = this.cellCenter(i);
      const x0 = cx - cell / 2;
      const y0 = cy - cell / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, cell, cell);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.74 * ease, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        painting,
        ((i % level.w) / level.w) * painting.width,
        (Math.floor(i / level.w) / level.h) * painting.height,
        painting.width / level.w,
        painting.height / level.h,
        x0,
        y0,
        cell,
        cell,
      );
      ctx.restore();
      Sprites.blit(ctx, this.marbleSprite(level.palette[b.color], md, 0), cx, cy, md * (1 - 0.25 * ease), 1 - ease);
    }

    // rollende Murmeln im Bild; wer noch wartet, liegt an seinem Startplatz
    for (const { fl, pos } of inside) {
      // eben noch schwebte die Murmel als Teil der Auswahl: Sie sinkt zurück und rollt dann los
      const settle = Math.max(0, 1 - (now - fl.t0) / SETTLE_MS) ** 2;
      const size = fl.fromSlot ? md : md * (1 + 0.07 * settle);
      const lift = fl.fromSlot ? 0 : fl.lift * settle;
      rollingMarble(level.palette[fl.color], pos.x, pos.y - lift, size, fl.turn + pos.rolled / (md / 2));
    }
    ctx.restore();

    // ---------- Holzbrett ----------
    const since = now - this.shakeAt;
    const shake = since < 640 ? Math.sin((since / 640) * Math.PI * 3) * 3.5 * (1 - since / 640) ** 2 : 0;
    const t = this.tray;
    // Ist das Bild fertig, tritt das Holzbrett zurück und lässt dem Bild die Bühne.
    const trayAlpha =
      this.finishedAt === 0 ? 1 : this.finishedAt < 0 ? 0 : Math.max(0, 1 - (now - this.finishedAt) / 1400);
    ctx.save();
    ctx.globalAlpha = trayAlpha;
    ctx.translate(shake, 0);
    if (!this.trayBg) this.buildTray();
    ctx.drawImage(this.trayBg as HTMLCanvasElement, t.x - 26, t.y - 26, t.w + 52, t.h + 52);
    if (sel?.source === 'board' && state.tray.includes(EMPTY)) {
      ctx.strokeStyle = LIGHT;
      ctx.globalAlpha = 0.5 + 0.45 * pulse;
      ctx.lineWidth = 2 + pulse;
      roundedRect(ctx, t.x - 4, t.y - 4, t.w + 8, t.h + 8, Math.min(18, t.h / 4 + 4));
      ctx.stroke();
      // Freie Mulden leuchten wie freie Löcher im Bild: Dorthin tippt man, um abzulegen.
      ctx.lineWidth = Math.max(1.4, t.slot * 0.07);
      ctx.globalAlpha = 0.4 + 0.4 * pulse;
      for (let k = 0; k < state.tray.length; k++) {
        if (state.tray[k] !== EMPTY || this.pendSlots.has(k)) continue;
        const [x, y] = this.slotCenter(k);
        ctx.beginPath();
        ctx.arc(x, y, t.slot * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = trayAlpha;
    }
    for (let k = 0; k < state.tray.length; k++) {
      const c = state.tray[k];
      if (c === EMPTY || this.pendSlots.has(k)) continue;
      const [x, y] = this.slotCenter(k);
      const lifted = trayActive;
      Sprites.blit(ctx, this.marbleSprite(level.palette[c], td, k % VARIANTS), x, y - (lifted ? 5 + pulse * 2 : 0), td);
    }
    ctx.restore();

    // ---------- unterwegs zwischen Bild und Holzbrett ----------
    // Das eine Ende des Wegstücks liegt im (vielleicht vergrößerten) Bild, das andere auf dem festen Brett.
    // Liegt das Feld gerade außerhalb des Fensters, kommt die Murmel vom Rand des Rahmens bzw. verschwindet dort.
    for (const { fl, pos } of between) {
      const aIn = this.inFrame(pos.from);
      const bIn = this.inFrame(pos.to);
      const a = aIn ? this.toFrameEdge(this.toView(pos.from)) : pos.from;
      const b = bIn ? this.toFrameEdge(this.toView(pos.to)) : pos.to;
      const da = aIn ? md * zoom : td;
      const db = bIn ? md * zoom : td;
      const size = da + (db - da) * pos.part;
      const settle = Math.max(0, 1 - (now - fl.t0) / SETTLE_MS) ** 2;
      const lift = fl.lift * settle * (aIn ? zoom : 1);
      const x = a[0] + (b[0] - a[0]) * pos.part;
      const y = a[1] + (b[1] - a[1]) * pos.part - lift;
      rollingMarble(level.palette[fl.color], x, y, size, fl.turn + pos.rolled / (md / 2));
    }

    // ---------- Lichter im Bild ----------
    ctx.save();
    this.applyCamera(ctx);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = this.twinkles.length - 1; k >= 0; k--) {
      const q = this.twinkles[k];
      const p = (now - q.t0) / q.dur;
      if (p >= 1) {
        this.twinkles.splice(k, 1);
        continue;
      }
      const a = Math.sin(p * Math.PI);
      glint(ctx, q.x, q.y, q.size * (0.35 + 0.25 * a), 0.4 * a);
    }
    // Abschluss: ein Lichtstreif zieht über das fertige Bild
    if (this.finishedAt > 0 && !this.reduceMotion && now - this.finishedAt < 2200) {
      const p = (now - this.finishedAt) / 2200;
      const bw = level.w * cell;
      const bh = level.h * cell;
      const at = p * 1.5 - 0.25;
      const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
      const gr = ctx.createLinearGradient(this.ox, this.oy, this.ox + bw, this.oy + bh);
      gr.addColorStop(clamp01(at - 0.16), 'rgba(255,255,255,0)');
      gr.addColorStop(clamp01(at), 'rgba(255,244,214,0.42)');
      gr.addColorStop(clamp01(at + 0.16), 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(this.ox, this.oy, bw, bh);
    }
    ctx.restore();
  }
}
