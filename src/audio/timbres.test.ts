import { describe, expect, it } from 'vitest';
import { glassCompletion, TIMBRE_RATE, woodContact } from './timbres';
import { midiToHz } from './tune';

function peak(data: Float32Array): number {
  return data.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
}

function energy(data: Float32Array, from: number, to: number): number {
  return data.slice(Math.round(from * TIMBRE_RATE), Math.round(to * TIMBRE_RATE)).reduce((sum, x) => sum + x * x, 0);
}

function amplitude(data: Float32Array, frequency: number, from: number, to: number): number {
  let re = 0;
  let im = 0;
  const start = Math.round(from * TIMBRE_RATE);
  const end = Math.round(to * TIMBRE_RATE);
  for (let i = start; i < end; i++) {
    const phase = (2 * Math.PI * frequency * i) / TIMBRE_RATE;
    re += data[i] * Math.cos(phase);
    im += data[i] * Math.sin(phase);
  }
  return Math.hypot(re, im) / (end - start);
}

describe('Gewählte Klangfarben C und 1', () => {
  it.each([43, 50, 60])('lässt den Akkord über Grundton %i deutlich nach oben aufgehen', (root) => {
    const [left, right] = glassCompletion(root);
    const low = midiToHz(root + 12);
    const high = midiToHz(root + 36);
    expect(amplitude(left, low, 0.125, 0.15)).toBeGreaterThan(amplitude(left, high, 0.125, 0.15) * 3);
    expect(amplitude(left, high, 0.85, 1.1)).toBeGreaterThan(amplitude(left, low, 0.85, 1.1) * 1.4);
    for (const channel of [left, right]) {
      expect(channel.every(Number.isFinite)).toBe(true);
      expect(peak(channel)).toBeGreaterThan(0.1);
      expect(peak(channel)).toBeLessThan(0.5);
      expect(energy(channel, 2.85, 3.02)).toBe(0);
    }
  });

  it('lässt das Holz in wenigen Millisekunden ausklingen, ohne tiefen Nachhall', () => {
    const contacts = Array.from({ length: 6 }, (_, k) => woodContact(440 + k));
    for (const data of contacts) {
      expect(data.every(Number.isFinite)).toBe(true);
      expect(peak(data)).toBeLessThan(0.6);
      expect(energy(data, 0.08, 0.28)).toBeLessThan(energy(data, 0, 0.08) * 0.001);
      expect(data[0]).toBe(0);
    }
    expect(contacts[0]).not.toEqual(contacts[1]);
  });
});
