import { midiToHz, nextStep, noteAt, restStep, Spread, startStep, type Walk } from './tune';

/**
 * Klang, vollständig im Browser erzeugt (keine Audiodateien). Zwei Schichten:
 *
 * - Murmeln: Jede Murmel, die einrastet, schlägt einen leisen Glockenton an. Alle Töne stammen aus der Fünftonleiter
 *   des Bildes, eine rollende Kette wird so von selbst zu einer kleinen Tonfolge, die auf einem Ruheton endet.
 * - Raum: einzelne lange Töne, die im Takt eines ruhigen Atemzugs kommen und gehen, gemeinsam mit dem Licht des
 *   Himmels. Welche Töne klingen, wechselt, und manche Atemzüge bleiben still.
 *
 * Beides lässt sich getrennt abschalten, denn manche spielen neben einem Hörbuch.
 */

/** Was zu hören ist: alles, nur die Murmeln, oder nichts */
export type SoundMode = 'alles' | 'murmeln' | 'aus';
export const SOUND_MODES: readonly SoundMode[] = ['alles', 'murmeln', 'aus'];

/**
 * Ein Atemzug des Raums: vier Sekunden kommen, sechs Sekunden gehen, also sechs Atemzüge in der Minute.
 * Um dieses Tempo herum schwingt die Herzfrequenz am stärksten mit der Atmung (siehe docs/art-direction.md).
 */
const SWELL_IN = 4;
const SWELL_OUT = 6;
export const BREATH_MS = (SWELL_IN + SWELL_OUT) * 1000;
/** Lagen der drei Raumstimmen, in Halbtönen über dem Grundton */
const ROOM: readonly (readonly number[])[] = [
  [0, 7, -5],
  [12, 14, 9, 16],
  [19, 21, 24, 16],
];

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export class Sound {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private wet: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private root = 50;
  private current: SoundMode;

  /** Töne der Murmeln im Bild: höchstens elf in der Sekunde, höchstens eine halbe Sekunde nach ihrem Anlass */
  private readonly bells = new Spread(0.09, 0.5);
  /** Klopfen auf dem Holzbrett */
  private readonly knocks = new Spread(0.06, 0.3);
  private walk: Walk = { step: 0, dir: 1 };

  private swells: { osc: OscillatorNode; gain: GainNode }[] = [];
  private lastRoom: number[] = [];
  /** Beginn eines Atemzugs auf der Uhr von performance.now() */
  private breathOrigin = 0;

  constructor(mode: SoundMode) {
    this.current = mode;
  }

  get mode(): SoundMode {
    return this.current;
  }

  /**
   * Weckt den Ton. Browser lassen Klang erst nach einer Berührung zu, und auf dem iPad zählt dafür das Loslassen
   * des Fingers, nicht das Aufsetzen. Deshalb wird dies bei jedem Tipp aufgerufen (siehe app.ts): beim ersten Mal
   * entsteht der Klang, später repariert derselbe Aufruf ihn nach einer Unterbrechung (App-Wechsel, Anruf).
   */
  unlock(): void {
    if (this.current === 'aus') return;
    if (!this.ctx) this.build();
    this.wake();
  }

  /** Setzt den Ton nach einer Unterbrechung fort. Ohne Berührung darf der Browser das ablehnen. */
  wake(): void {
    const ctx = this.ctx;
    // Nicht darauf warten: Ohne gültige Berührung bleibt die Antwort aus.
    if (ctx && this.current !== 'aus' && ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  }

  setMode(mode: SoundMode): void {
    this.current = mode;
    if (mode !== 'aus') this.unlock();
    if (mode !== 'alles') this.hushRoom(0.4);
    if (this.ctx && this.out) this.out.gain.setTargetAtTime(mode === 'aus' ? 0 : 0.9, this.ctx.currentTime, 0.08);
  }

  /**
   * Richtet den Atem des Raums an einer Uhr aus (Millisekunden wie bei performance.now()): Der Klang schwillt dann
   * im selben Takt an und ab wie das Licht des Himmels, statt neben ihm herzulaufen.
   */
  alignBreath(originMs: number): void {
    this.breathOrigin = originMs;
  }

  /** Grundton des Bildes (MIDI-Nummer). Jedes Motiv klingt in seiner eigenen Tonart. */
  setRoot(midi: number): void {
    if (midi === this.root) return;
    this.root = midi;
    // Töne der alten Tonart klingen rasch aus, damit sie sich nicht mit der neuen reiben.
    this.hushRoom(0.6);
  }

  /**
   * Eine Murmel rastet im Bild ein. `rank` zählt die Ankünfte innerhalb der Kette ab 0.
   * Die Töne wandern in kleinen Schritten durch die Leiter, der letzte kommt auf Grundton oder Quinte zur Ruhe.
   */
  clink(rank: number, total: number, color: number): void {
    const ctx = this.ready();
    if (!ctx) return;
    const last = rank === total - 1;
    const at = this.bells.at(ctx.currentTime, last);
    if (at === null) return;
    const before = this.walk.step;
    this.walk = rank === 0 ? { step: startStep(color), dir: 1 } : nextStep(this.walk, Math.random());
    const step = last && total > 2 ? restStep(this.walk.step, before) : this.walk.step;
    // Lange Ketten: leisere, kürzere Töne, damit sie sich nicht zu einem Teppich aufschichten. Der Schlusston klingt aus.
    const level = (0.1 / (1 + total / 24)) * (0.85 + Math.random() * 0.15);
    const decay = last ? 2.1 : Math.max(0.6, 1.6 - total * 0.06);
    this.bell(midiToHz(noteAt(this.root + 12, step)), last ? level * 1.15 : level, decay, at, last || total <= 8);
  }

  /** Eine Murmel fällt in eine Mulde des Holzbretts: ein kurzes, trockenes Klopfen. */
  tock(rank: number, total: number): void {
    const ctx = this.ready();
    if (!ctx || !this.out) return;
    const t = this.knocks.at(ctx.currentTime, rank === total - 1);
    if (t === null) return;
    const soft = 1 / (1 + total / 30);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 620 + (rank % 5) * 45 + Math.random() * 60;
    band.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2 * soft, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.07);
    src.connect(band).connect(g).connect(this.out);
    src.start(t);
    src.stop(t + 0.09);
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(165, t);
    osc.frequency.exponentialRampToValueAtTime(96, t + 0.1);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.16 * soft, t);
    og.gain.exponentialRampToValueAtTime(0.0008, t + 0.13);
    osc.connect(og).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Murmeln ausgewählt: ein kaum hörbarer hoher Ton */
  pick(): void {
    this.bell(midiToHz(noteAt(this.root + 24, 2)), 0.026, 0.35);
  }

  /** Das geht gerade nicht: ein weicher, tiefer Stups. Bewusst kein Fehlerton. */
  nope(): void {
    this.bell(midiToHz(this.root), 0.06, 0.4);
  }

  /** Eine Farbe des Bildes ist vollständig: Grundton und Quinte klingen leise darunter auf. */
  settle(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const at = ctx.currentTime + 0.35;
    this.bell(midiToHz(this.root), 0.05, 3.4, at);
    this.bell(midiToHz(this.root + 7), 0.036, 3.0, at + 0.12);
  }

  /** Das Bild ist fertig: ein langsam aufsteigender Akkord. */
  finish(): void {
    const ctx = this.ready();
    if (!ctx) return;
    [0, 7, 12, 14, 19, 24].forEach((interval, k) => {
      this.bell(midiToHz(this.root + interval), 0.065, 3.4, ctx.currentTime + k * 0.36);
    });
  }

  // ---------- intern ----------

  /** Der Tonkontext, wenn gerade etwas erklingen darf. Sonst würden sich geplante Töne stauen und später auf einmal erklingen. */
  private ready(): AudioContext | null {
    const ctx = this.ctx;
    return ctx && this.out && this.current !== 'aus' && ctx.state === 'running' ? ctx : null;
  }

  private build(): void {
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return;
    try {
      // "ambient": mischt sich unter ein laufendes Hörbuch oder Musik, statt sie zu unterbrechen,
      // und richtet sich nach dem Stummmodus des Geräts.
      const session = (navigator as AudioSessionNavigator).audioSession;
      if (session) session.type = 'ambient';
    } catch {
      // ohne diese Schnittstelle gilt das Standardverhalten des Browsers
    }
    let ctx: AudioContext;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch {
      return;
    }
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.ratio.value = 6;
    limiter.connect(ctx.destination);
    this.out = ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(limiter);
    // Hall: ein kurzer, weicher Raum aus verrauschtem Ausklang
    const convolver = ctx.createConvolver();
    convolver.buffer = this.impulse(ctx, 2.6);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.42;
    this.wet.connect(convolver).connect(this.out);
    this.breathe();
  }

  private impulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const fade = (1 - i / length) ** 2.6;
        // leichtes Glätten nimmt dem Hall die Schärfe
        last = last * 0.55 + (Math.random() * 2 - 1) * 0.45;
        data[i] = last * fade;
      }
    }
    return buffer;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  /**
   * Der Raum atmet in einem festen Takt. Zu Beginn jedes Atemzugs entscheidet der Zufall, ob keine, eine oder zwei
   * der drei Stimmen einen langen Ton spielen und welchen. Der Takt bleibt also gleich, die Töne wiederholen sich
   * nicht, und manche Atemzüge bleiben still.
   */
  private breathe(): void {
    const phase = (((performance.now() - this.breathOrigin) % BREATH_MS) + BREATH_MS) % BREATH_MS;
    window.setTimeout(() => {
      this.breath();
      this.breathe();
    }, BREATH_MS - phase);
  }

  private breath(): void {
    if (!this.ready() || this.current !== 'alles' || document.hidden) return;
    const dice = Math.random();
    const count = dice < 0.2 ? 0 : dice < 0.7 ? 1 : 2;
    if (count === 0) return;
    // die tiefe Stimme trägt am häufigsten
    const pickVoice = Math.random();
    const first = pickVoice < 0.45 ? 0 : pickVoice < 0.78 ? 1 : 2;
    this.swell(first);
    if (count === 2) this.swell((first + 1 + Math.floor(Math.random() * 2)) % ROOM.length);
  }

  private swell(voice: number): void {
    const ctx = this.ready();
    if (!ctx || !this.out) return;
    const pool = ROOM[voice];
    let pick = Math.floor(Math.random() * pool.length);
    if (pick === this.lastRoom[voice]) pick = (pick + 1) % pool.length;
    this.lastRoom[voice] = pick;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = voice === 0 ? 'sine' : 'triangle';
    osc.frequency.value = midiToHz(this.root + pool[pick]);
    osc.detune.value = (Math.random() - 0.5) * 8;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    const peak = voice === 0 ? 0.05 : 0.022;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + SWELL_IN);
    gain.gain.setTargetAtTime(0, t + SWELL_IN, SWELL_OUT / 4);
    osc.connect(filter).connect(gain).connect(this.out);
    if (this.wet) gain.connect(this.wet);
    osc.start(t);
    osc.stop(t + SWELL_IN + SWELL_OUT + 2);
    const entry = { osc, gain };
    this.swells.push(entry);
    osc.onended = () => {
      this.swells = this.swells.filter((s) => s !== entry);
    };
  }

  /** Lässt die langen Töne des Raums rasch ausklingen. */
  private hushRoom(seconds: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const { osc, gain } of this.swells) {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setTargetAtTime(0, t, seconds / 3);
      try {
        osc.stop(t + seconds * 2);
      } catch {
        // schon beendet
      }
    }
  }

  /** Weicher Glockenton: Grundton mit zwei leisen Obertönen, die schneller verklingen. */
  private bell(freq: number, peak: number, decay: number, at?: number, full = true): void {
    const ctx = this.ready();
    if (!ctx || !this.out) return;
    const t = Math.max(at ?? 0, ctx.currentTime);
    const partials: [number, number, number][] = [
      [1, 1, decay],
      [2.76, 0.22, decay * 0.35],
    ];
    if (full) partials.push([5.4, 0.07, decay * 0.18]);
    for (const [ratio, level, dur] of partials) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak * level, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(this.out);
      if (this.wet) g.connect(this.wet);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  }
}
