import type { Layer, Scene, Shape } from '../core/scene';
import { band, blob, blossom, ellipse, fir, lilyPad, poly, ridge, trunk } from '../core/shapes';

/**
 * Die Motive. Jedes ist ein Papierschnitt: wenige Farben, übereinanderliegende Lagen, weiches Licht von oben links.
 * Die Palette ist zugleich der Satz der Murmelfarben, deshalb müssen die Farben klar auseinanderliegen
 * (geprüft in scenes.test.ts). Feine Einzelheiten (`ink`) gehören nur zum Bild, nicht zum Raster.
 */

type Shade = { angle: number; amount: number };
const cut = (color: number, shape: Shape | 'full', lift = 0, shade?: Shade): Layer => ({ color, shape, lift, shade });
const detail = (ink: string, shape: Shape, lift = 0): Layer => ({ color: 0, ink, shape, lift });

// ---------- Mond über dem See ----------
const mond: Scene = {
  id: 'mond',
  name: 'Mond über dem See',
  size: 16,
  palette: ['#2c3f86', '#9a8fcc', '#f6e9c0', '#35978a', '#0a0d1a'],
  mood: { top: '#1a2452', bottom: '#56508f', ink: '#f3ecd8', root: 50 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.3 }),
    detail('#e9e2c9', ellipse(0.2, 0.12, 0.006)),
    detail('#e9e2c9', ellipse(0.38, 0.22, 0.005)),
    detail('#e9e2c9', ellipse(0.88, 0.1, 0.006)),
    detail('#e9e2c9', ellipse(0.48, 0.07, 0.004)),
    detail('#e9e2c9', ellipse(0.1, 0.33, 0.004)),
    cut(1, band(0.41, 0.7, 0.014, 1.4, 0.4), 0, { angle: 90, amount: 0.25 }),
    cut(2, ellipse(0.67, 0.26, 0.135), 0.5, { angle: 45, amount: -0.12 }),
    cut(3, ridge({ y: 0.6, amp: 0.07, waves: 1.5, phase: 0.9, rough: 0.25 }), 0.5, { angle: 90, amount: -0.2 }),
    cut(1, band(0.75, 1.05, 0.006, 2, 0.5), 0.35, { angle: 90, amount: -0.3 }),
    detail('#f6e9c0', ellipse(0.67, 0.805, 0.085, 0.011)),
    detail('#f6e9c0', ellipse(0.665, 0.855, 0.06, 0.01)),
    detail('#f6e9c0', ellipse(0.672, 0.9, 0.04, 0.009)),
    detail('#f6e9c0', ellipse(0.668, 0.94, 0.022, 0.008)),
    cut(4, ridge({ y: 0.9, amp: 0.05, waves: 1.05, phase: 2.7, rough: 0.2, tilt: 0.16 }), 0.8),
    cut(4, fir(0.13, 0.86, 0.3, 0.12), 0.8),
    cut(4, fir(0.25, 0.89, 0.2, 0.09), 0.8),
  ],
};

// ---------- Nebelberge ----------
const nebel: Scene = {
  id: 'nebel',
  name: 'Nebelberge',
  size: 20,
  palette: ['#f5b886', '#fff6e2', '#dc6f86', '#b196d2', '#3b5cae', '#0f1430'],
  mood: { top: '#eba784', bottom: '#8f78b0', ink: '#241d3d', root: 53 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.22 }),
    cut(1, ellipse(0.3, 0.26, 0.105), 0.3),
    cut(2, ridge({ y: 0.44, amp: 0.06, waves: 1.3, phase: 0.3, rough: 0.5 }), 0.4, { angle: 90, amount: 0.3 }),
    cut(3, ridge({ y: 0.57, amp: 0.07, waves: 1.7, phase: 2.1, rough: 0.5 }), 0.5, { angle: 90, amount: 0.3 }),
    cut(4, ridge({ y: 0.71, amp: 0.07, waves: 1.2, phase: 4.0, rough: 0.45 }), 0.6, { angle: 90, amount: 0.3 }),
    cut(5, ridge({ y: 0.87, amp: 0.06, waves: 1.9, phase: 1.2, rough: 0.4 }), 0.7),
    detail('#0f1430', fir(0.82, 0.86, 0.12, 0.05), 0.7),
    detail('#0f1430', fir(0.88, 0.87, 0.09, 0.04), 0.7),
  ],
};

// ---------- Seerosen ----------
const pads: [number, number, number, number, number][] = [
  [0.24, 0.3, 0.135, 0.6, 2],
  [0.53, 0.19, 0.1, 2.4, 3],
  [0.77, 0.33, 0.145, 4.2, 2],
  [0.35, 0.63, 0.155, 5.2, 3],
  [0.67, 0.67, 0.125, 1.2, 2],
  [0.86, 0.87, 0.115, 3.3, 3],
  [0.13, 0.82, 0.095, 0.2, 2],
  [0.52, 0.92, 0.085, 2.0, 3],
  [0.07, 0.52, 0.07, 1.5, 3],
];
const seerosen: Scene = {
  id: 'seerosen',
  name: 'Seerosen',
  size: 24,
  palette: ['#1c5367', '#5ca6aa', '#93c267', '#3a7b55', '#fcd3e1'],
  mood: { top: '#17475a', bottom: '#3f8088', ink: '#eef6ee', root: 55 },
  layers: [
    cut(0, 'full', 0, { angle: 60, amount: 0.2 }),
    cut(1, blob(0.3, 0.24, 0.27, { wobble: 0.18, seed: 3, squash: 0.8 }), 0, { angle: 45, amount: 0.2 }),
    cut(1, blob(0.8, 0.7, 0.25, { wobble: 0.2, seed: 5, squash: 0.9 }), 0, { angle: 45, amount: 0.2 }),
    cut(1, blob(0.14, 0.88, 0.15, { seed: 8 }), 0),
    ...pads.map(([x, y, r, notch, color]) => cut(color, lilyPad(x, y, r, notch), 0.5, { angle: 45, amount: -0.18 })),
    cut(4, blossom(0.27, 0.27, 0.085, 8, 0.2), 0.7),
    detail('#fff1c4', ellipse(0.27, 0.27, 0.028)),
    cut(4, blossom(0.68, 0.65, 0.078, 8, 0.6), 0.7),
    detail('#fff1c4', ellipse(0.68, 0.65, 0.025)),
    cut(4, blossom(0.38, 0.6, 0.062, 7, 0.1), 0.7),
    detail('#fff1c4', ellipse(0.38, 0.6, 0.02)),
  ],
};

// ---------- Birken im Herbst ----------
const birken: Scene = {
  id: 'birken',
  name: 'Birken im Herbst',
  size: 24,
  palette: ['#f5cb62', '#db7623', '#9c3f2a', '#f6f1e4', '#231d1e', '#7da064'],
  mood: { top: '#af7c4d', bottom: '#734434', ink: '#fbf2df', root: 52 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.18 }),
    cut(2, ridge({ y: 0.52, amp: 0.05, waves: 2.2, rough: 0.6, phase: 1 }), 0.2, { angle: 90, amount: -0.2 }),
    cut(1, blob(0.18, 0.1, 0.27, { seed: 2, squash: 0.7 }), 0.4),
    cut(1, blob(0.62, 0.06, 0.31, { seed: 4, squash: 0.6 }), 0.4),
    cut(1, blob(0.97, 0.2, 0.2, { seed: 6 }), 0.4),
    cut(5, ridge({ y: 0.79, amp: 0.03, waves: 3, rough: 0.5 }), 0.3),
    cut(4, ridge({ y: 0.91, amp: 0.02, waves: 2, rough: 0.3, phase: 2 }), 0.4),
    cut(3, trunk(0.3, 0.045, 0.01), 0.5),
    cut(3, trunk(0.75, 0.045, -0.01), 0.5),
    cut(3, trunk(0.14, 0.085, 0.012), 0.9, { angle: 0, amount: -0.14 }),
    cut(3, trunk(0.44, 0.1, -0.015), 0.9, { angle: 0, amount: -0.14 }),
    cut(3, trunk(0.62, 0.07, 0.02), 0.9, { angle: 0, amount: -0.14 }),
    cut(3, trunk(0.88, 0.09, -0.012), 0.9, { angle: 0, amount: -0.14 }),
    ...[
      [0.125, 0.2, 0.03],
      [0.155, 0.46, 0.025],
      [0.13, 0.7, 0.032],
      [0.42, 0.12, 0.035],
      [0.455, 0.36, 0.03],
      [0.43, 0.62, 0.04],
      [0.63, 0.28, 0.022],
      [0.615, 0.55, 0.025],
      [0.89, 0.18, 0.03],
      [0.865, 0.44, 0.034],
      [0.89, 0.72, 0.03],
    ].map(([x, y, w]) => detail('#231d1e', ellipse(x, y, w * 0.75, 0.008, 0.1))),
  ],
};

// ---------- Fuchs im Schnee ----------
const fuchs: Scene = {
  id: 'fuchs',
  name: 'Fuchs im Schnee',
  size: 28,
  palette: ['#3a5196', '#f0f4f7', '#8fb1dc', '#e6782a', '#86341c', '#0a0e1c', '#f7d67c'],
  mood: { top: '#24336a', bottom: '#7890bd', ink: '#f3f6f8', root: 48 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.25 }),
    cut(6, ellipse(0.22, 0.17, 0.085), 0.4),
    ...[
      [0.45, 0.08],
      [0.6, 0.2],
      [0.78, 0.07],
      [0.9, 0.24],
      [0.36, 0.27],
      [0.08, 0.33],
    ].map(([x, y]) => detail('#f6ecc4', ellipse(x, y, 0.005))),
    cut(5, fir(0.07, 0.52, 0.27, 0.13), 0.4),
    cut(5, fir(0.2, 0.5, 0.19, 0.1), 0.4),
    cut(5, fir(0.64, 0.5, 0.17, 0.09), 0.4),
    cut(5, fir(0.8, 0.52, 0.31, 0.14), 0.4),
    cut(5, fir(0.94, 0.5, 0.21, 0.1), 0.4),
    cut(2, ridge({ y: 0.46, amp: 0.03, waves: 1.2, phase: 1, rough: 0.2 }), 0.4, { angle: 90, amount: 0.2 }),
    cut(1, ridge({ y: 0.58, amp: 0.035, waves: 0.9, phase: 3, rough: 0.15 }), 0.5),
    cut(2, blob(0.5, 0.885, 0.32, { squash: 0.2, wobble: 0.08, seed: 3 }), 0),
    // Schwanz mit weißer Spitze, liegt um den Körper
    cut(3, ellipse(0.35, 0.815, 0.18, 0.07, 0.22), 0.6, { angle: 90, amount: -0.2 }),
    cut(1, ellipse(0.215, 0.77, 0.065, 0.048, 0.22), 0.6),
    // Körper, Pfoten, Kopf mit Ohren
    cut(3, ellipse(0.52, 0.75, 0.2, 0.118, -0.05), 0.7, { angle: 90, amount: -0.25 }),
    cut(4, ellipse(0.6, 0.86, 0.085, 0.036, 0.05), 0.5),
    cut(4, ellipse(0.44, 0.875, 0.06, 0.03, -0.05), 0.5),
    cut(4, poly([0.645, 0.725], [0.682, 0.622], [0.728, 0.71]), 0.8),
    cut(4, poly([0.718, 0.728], [0.768, 0.642], [0.798, 0.742]), 0.8),
    cut(3, ellipse(0.705, 0.77, 0.092, 0.074, 0.2), 0.8, { angle: 90, amount: -0.2 }),
    cut(1, ellipse(0.768, 0.8, 0.046, 0.033, 0.25), 0.2),
    detail('#0a0e1c', ellipse(0.808, 0.795, 0.012)),
    detail('#0a0e1c', ellipse(0.712, 0.767, 0.022, 0.005, 0.5)),
  ],
};

export const SCENES: readonly Scene[] = [mond, nebel, seerosen, birken, fuchs];

export const sceneById = (id: string): Scene | undefined => SCENES.find((s) => s.id === id);
