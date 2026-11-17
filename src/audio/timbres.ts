import { makeRng } from '../core/random';
import { midiToHz } from './tune';

/** Die Hörproben wurden mit 48 kHz gestaltet. Der Browser passt die Puffer an das Ausgabegerät an. */
export const TIMBRE_RATE = 48000;
type Stereo = readonly [Float32Array, Float32Array];
type Partial = readonly [frequency: number, strength: number, decay: number];

/** Gedämpfte Schwingungen: die Rekursion vermeidet Sinus und Exponentialfunktion für jeden Abtastwert. */
function resonances(length: number, parts: readonly Partial[], attack: number, fade: number): Float32Array {
  const data = new Float32Array(length);
  const attackStep = Math.exp(-1 / (TIMBRE_RATE * attack));
  const fadeSamples = Math.round(fade * TIMBRE_RATE);
  for (const [frequency, strength, decay] of parts) {
    const step = (2 * Math.PI * frequency) / TIMBRE_RATE;
    const damp = Math.exp(-1 / (TIMBRE_RATE * decay));
    const a = Math.cos(step) * damp;
    const b = Math.sin(step) * damp;
    let real = strength;
    let imaginary = 0;
    let onset = 1;
    for (let i = 0; i < length; i++) {
      const tail = Math.min(1, (length - 1 - i) / Math.max(1, fadeSamples - 1));
      data[i] += imaginary * (1 - onset) * tail ** 2;
      const next = real * a - imaginary * b;
      imaginary = imaginary * a + real * b;
      real = next;
      onset *= attackStep;
    }
  }
  return data;
}

/** Gewählt: C, heller Glasklang. Der Dur-Akkord öffnet sich bis zum hohen Grundton. */
export function glassCompletion(root: number): Stereo {
  const length = Math.round(2.7 * TIMBRE_RATE);
  const dry: Stereo = [new Float32Array(length), new Float32Array(length)];
  const notes = [
    [12, 0, 0.36],
    [16, 0.035, 0.32],
    [19, 0.07, 0.32],
    [24, 0.18, 0.55],
    [28, 0.31, 0.46],
    [36, 0.48, 0.39],
  ];
  notes.forEach(([interval, at, strength], k) => {
    const start = Math.round(at * TIMBRE_RATE);
    const f = midiToHz(root + interval);
    const tone = resonances(
      length - start,
      [
        [f, 1, 0.63],
        [f * 2, 0.12, 0.22],
        [f * 3, 0.045, 0.12],
        [f * 4.01, 0.015, 0.07],
      ],
      0.003,
      0.18,
    );
    const angle = (((k / (notes.length - 1) - 0.5) * 0.24 + 1) * Math.PI) / 4;
    const gains = [Math.cos(angle), Math.sin(angle)];
    for (let ch = 0; ch < 2; ch++) {
      for (let i = 0; i < tone.length; i++) dry[ch][start + i] += tone[i] * strength * gains[ch];
    }
  });
  const lead = Math.round(0.12 * TIMBRE_RATE);
  const result: Stereo = [
    new Float32Array(Math.round(3.02 * TIMBRE_RATE)),
    new Float32Array(Math.round(3.02 * TIMBRE_RATE)),
  ];
  for (let ch = 0; ch < 2; ch++) {
    result[ch].set(dry[ch], lead);
    // Derselbe kleine Raum wie in Hörprobe C; kein zusätzlicher langer Glockenhall.
    for (const [delay, gain] of [
      [0.023, 0.09],
      [0.043, 0.065],
      [0.079, 0.045],
      [0.137, 0.027],
    ]) {
      const n = Math.round(delay * TIMBRE_RATE);
      for (let i = n; i < length; i++) result[ch][lead + i] += dry[1 - ch][i - n] * gain;
    }
    for (let i = 0; i < result[ch].length; i++) result[ch][i] *= 0.26091;
  }
  return result;
}

/** Gewählt: 1, trockenes Holz. Kleine Variationen verhindern identische Kontakte in langen Ketten. */
export function woodContact(seed: number): Float32Array {
  const rng = makeRng(seed);
  const tuning = 1 + (rng() * 2 - 1) * 0.035;
  const length = Math.round(0.28 * TIMBRE_RATE);
  const data = resonances(
    length,
    [
      [690 * tuning, 0.44, 0.019],
      [1410 * tuning, 0.34, 0.013],
      [2440 * tuning, 0.15, 0.0065],
      [3770 * tuning, 0.055, 0.004],
    ],
    0.00016,
    0.02,
  );
  const noise = Float64Array.from(
    { length },
    () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng()),
  );
  // Butterworth-Bandpass der Hörprobe: 1250–6300 Hz bei 48 kHz, zwei Biquads.
  for (const [b0, b1, b2, a1, a2] of [
    [0.073441449687, 0.146882899375, 0.073441449687, -1.092402392329, 0.478463566145],
    [1, -2, 1, -1.793690142205, 0.824685061149],
  ]) {
    let z1 = 0;
    let z2 = 0;
    for (let i = 0; i < length; i++) {
      const input = noise[i];
      const output = b0 * input + z1;
      z1 = b1 * input - a1 * output + z2;
      z2 = b2 * input - a2 * output;
      noise[i] = output;
    }
  }
  for (let i = 0; i < length; i++) {
    const t = i / TIMBRE_RATE;
    data[i] += 0.32 * noise[i] * Math.exp(-t / 0.0017) * (1 - Math.exp(-t / 0.00016));
    data[i] *= 0.721 / Math.SQRT2;
  }
  return data;
}
