import { describe, expect, it } from 'vitest';
import { chroma, deltaE, hexToRgb, luminance, minDeltaE, minDeltaEFor, mix, rgba, rgbToHex, simulate } from './color';

describe('Farben', () => {
  it('wandelt Hex und RGB verlustfrei um', () => {
    expect(hexToRgb('#1f5ad8')).toEqual([31, 90, 216]);
    expect(rgbToHex(31, 90, 216)).toBe('#1f5ad8');
    expect(rgbToHex(-5, 300, 12.4)).toBe('#00ff0c');
  });

  it('mischt zwei Farben', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#102030', '#ffffff', 0)).toBe('#102030');
    expect(rgba('#102030', 0.5)).toBe('rgba(16,32,48,0.5)');
  });

  it('misst wahrgenommene Abstände', () => {
    expect(deltaE('#000000', '#ffffff')).toBeCloseTo(100, 0);
    expect(deltaE('#336699', '#336699')).toBe(0);
    expect(luminance('#ffffff')).toBeGreaterThan(luminance('#808080'));
  });

  it('misst die Buntheit', () => {
    expect(chroma('#808080')).toBeLessThan(1);
    expect(chroma('#e6782a')).toBeGreaterThan(60);
    expect(chroma('#9a8fcc')).toBeLessThan(chroma('#e6782a'));
  });

  it('ahmt Farbfehlsichtigkeit nach', () => {
    // Grau bleibt grau, Schwarz und Weiß bleiben, was sie sind
    expect(deltaE(simulate('#808080', 'deutan'), '#808080')).toBeLessThan(1.5);
    expect(simulate('#000000', 'protan')).toBe('#000000');
    expect(deltaE(simulate('#ffffff', 'tritan'), '#ffffff')).toBeLessThan(1.5);
    // Rot und Grün gleicher Helligkeit rücken zusammen, Blau und Gelb bleiben weit auseinander
    const red = '#c0504d';
    const green = '#5f8f3a';
    expect(deltaE(simulate(red, 'deutan'), simulate(green, 'deutan'))).toBeLessThan(deltaE(red, green) / 2);
    expect(deltaE(simulate('#2c3f86', 'deutan'), simulate('#f5cb62', 'deutan'))).toBeGreaterThan(60);
  });

  it('findet das Paar, das bei Farbfehlsichtigkeit am ähnlichsten wirkt', () => {
    const { value, pair } = minDeltaEFor(['#c0504d', '#2c3f86', '#5f8f3a', '#f6f1e4'], 'deutan');
    expect(pair).toEqual(['#c0504d', '#5f8f3a']);
    expect(value).toBeLessThan(deltaE('#c0504d', '#5f8f3a'));
  });

  it('findet das ähnlichste Paar einer Palette', () => {
    const { value, pair } = minDeltaE(['#ff0000', '#00ff00', '#fe0505', '#0000ff']);
    expect(pair).toEqual(['#ff0000', '#fe0505']);
    expect(value).toBeLessThan(5);
  });
});
