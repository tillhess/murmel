import type { Layer, Scene, Shape } from '../core/scene';
import {
  arc,
  balloon,
  band,
  blob,
  blossom,
  capsule,
  cloud,
  crescent,
  dome,
  ellipse,
  fir,
  flower,
  leaf,
  lilyPad,
  poly,
  rect,
  ribbon,
  ridge,
  saguaro,
  trunk,
} from '../core/shapes';

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

// ---------- Segelboot im Abendlicht ----------
const segelboot: Scene = {
  id: 'segelboot',
  name: 'Segelboot im Abendlicht',
  size: 16,
  palette: ['#f0a15f', '#ffe9a6', '#3f8d9b', '#1c4a63', '#fbf7ee', '#231018'],
  mood: { top: '#9f6243', bottom: '#1f4b61', ink: '#fff1dc', root: 53 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.2 }),
    detail('#f8c594', ellipse(0.76, 0.13, 0.19, 0.013)),
    detail('#f8c594', ellipse(0.16, 0.24, 0.12, 0.01)),
    cut(1, ellipse(0.3, 0.47, 0.17), 0.3),
    cut(2, band(0.555, 1.05, 0.005, 1.4, 0.4), 0.35, { angle: 90, amount: -0.2 }),
    detail('#ffe9a6', ellipse(0.3, 0.6, 0.12, 0.009)),
    detail('#ffe9a6', ellipse(0.31, 0.65, 0.08, 0.008)),
    detail('#ffe9a6', ellipse(0.295, 0.7, 0.05, 0.007)),
    // zwei Möwen
    detail(
      '#231018',
      poly(
        [0.1, 0.1],
        [0.135, 0.085],
        [0.15, 0.1],
        [0.165, 0.085],
        [0.2, 0.1],
        [0.165, 0.093],
        [0.15, 0.11],
        [0.135, 0.093],
      ),
    ),
    detail(
      '#231018',
      poly(
        [0.24, 0.16],
        [0.265, 0.149],
        [0.276, 0.16],
        [0.287, 0.149],
        [0.312, 0.16],
        [0.287, 0.155],
        [0.276, 0.168],
        [0.265, 0.155],
      ),
    ),
    cut(4, poly([0.63, 0.15], [0.63, 0.69], [0.89, 0.69]), 0.7, { angle: 0, amount: -0.1 }),
    cut(4, poly([0.605, 0.25], [0.605, 0.69], [0.44, 0.69]), 0.7),
    detail('#231018', rect(0.612, 0.1, 0.623, 0.73)),
    detail('#ffe9a6', poly([0.623, 0.1], [0.69, 0.118], [0.623, 0.136])),
    cut(5, poly([0.4, 0.725], [0.93, 0.725], [0.86, 0.815], [0.48, 0.815]), 0.8),
    detail('#fbf7ee', rect(0.43, 0.74, 0.9, 0.748)),
    cut(3, ridge({ y: 0.81, amp: 0.016, waves: 1.7, phase: 0.6, rough: 0.2 }), 0.5),
  ],
};

// ---------- Heißluftballon über Hügeln ----------
const ballon: Scene = {
  id: 'ballon',
  name: 'Heißluftballon über Hügeln',
  size: 18,
  palette: ['#9ccbe6', '#fdf9ef', '#cd3b21', '#a9cc6f', '#4f9060', '#1d3530'],
  mood: { top: '#9ccbe6', bottom: '#8fbf8a', ink: '#1d3530', root: 55 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.12 }),
    cut(1, cloud(0.77, 0.2, 0.42, 0.11, 3), 0.3),
    cut(1, cloud(0.14, 0.44, 0.3, 0.085, 7), 0.3),
    // Tannen hinter der Kuppe des fernen Hügels
    cut(5, fir(0.73, 0.7, 0.15, 0.07), 0.3),
    cut(5, fir(0.81, 0.7, 0.2, 0.085), 0.3),
    cut(5, fir(0.89, 0.7, 0.14, 0.065), 0.3),
    cut(3, ridge({ y: 0.64, amp: 0.045, waves: 1.05, phase: 0.4, rough: 0.15 }), 0.4, { angle: 90, amount: -0.15 }),
    cut(4, ridge({ y: 0.79, amp: 0.04, waves: 1.3, phase: 2.6, rough: 0.15 }), 0.5, { angle: 90, amount: -0.15 }),
    cut(5, ridge({ y: 0.945, amp: 0.02, waves: 1.6, phase: 1.0, rough: 0.2 }), 0.6),
    // ein zweiter Ballon, weit weg
    cut(2, balloon(0.87, 0.38, 0.055, 0.07), 0.4),
    detail('#1d3530', rect(0.86, 0.458, 0.88, 0.476)),
    // der Ballon: rote Hülle mit heller Mittelbahn, Seile, Korb
    cut(2, balloon(0.44, 0.27, 0.2, 0.25), 0.8, { angle: 0, amount: -0.12 }),
    cut(1, balloon(0.44, 0.27, 0.2, 0.25, 0.36), 0.15),
    detail('#1d3530', poly([0.402, 0.52], [0.407, 0.52], [0.417, 0.57], [0.412, 0.57])),
    detail('#1d3530', poly([0.478, 0.52], [0.473, 0.52], [0.463, 0.57], [0.468, 0.57])),
    cut(5, rect(0.405, 0.565, 0.475, 0.63), 0.8),
  ],
};

// ---------- Wüste am Abend ----------
const wueste: Scene = {
  id: 'wueste',
  name: 'Wüste am Abend',
  size: 20,
  palette: ['#c08fb0', '#fde3a0', '#6a4a80', '#cf6a45', '#2a1626', '#2f6650'],
  mood: { top: '#8c6384', bottom: '#8a4a3a', ink: '#fff0d8', root: 49 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.22 }),
    ...[
      [0.62, 0.08],
      [0.9, 0.16],
      [0.12, 0.13],
      [0.45, 0.2],
    ].map(([x, y]) => detail('#fde3a0', ellipse(x, y, 0.005))),
    cut(1, ellipse(0.3, 0.39, 0.135), 0.3),
    cut(
      2,
      poly(
        [-0.02, 0.57],
        [0.03, 0.57],
        [0.08, 0.44],
        [0.37, 0.44],
        [0.43, 0.56],
        [0.56, 0.56],
        [0.6, 0.48],
        [0.8, 0.48],
        [0.85, 0.57],
        [1.02, 0.57],
        [1.02, 1.02],
        [-0.02, 1.02],
      ),
      0.4,
      { angle: 90, amount: 0.25 },
    ),
    cut(3, ridge({ y: 0.66, amp: 0.035, waves: 1.0, phase: 0.8, rough: 0.12 }), 0.5, { angle: 90, amount: -0.2 }),
    cut(4, ridge({ y: 0.86, amp: 0.03, waves: 0.8, phase: 3.4, rough: 0.12 }), 0.6),
    cut(
      5,
      saguaro(0.72, 0.94, 0.68, 0.1, [
        { side: -1, at: 0.3, reach: 0.14, rise: 0.17, width: 0.07 },
        { side: 1, at: 0.4, reach: 0.135, rise: 0.2, width: 0.07 },
      ]),
      0.9,
      { angle: 0, amount: -0.12 },
    ),
    cut(5, saguaro(0.17, 0.95, 0.36, 0.08, [{ side: 1, at: 0.15, reach: 0.105, rise: 0.1, width: 0.055 }]), 0.9),
    // Rippen der Kakteen
    ...[
      [0.705, 0.3, 0.9],
      [0.735, 0.3, 0.9],
      [0.58, 0.5, 0.63],
      [0.855, 0.37, 0.53],
      [0.17, 0.63, 0.93],
    ].map(([x, y0, y1]) => detail('#3f7a62', rect(x - 0.003, y0, x + 0.003, y1))),
  ],
};

// ---------- Kirschblütenzweig ----------
const blueten: [number, number, number, number][] = [
  [0.08, 0.74, 0.07, 0.3],
  [0.27, 0.62, 0.085, 1.1],
  [0.45, 0.5, 0.09, 0.2],
  [0.62, 0.4, 0.08, 0.8],
  [0.73, 0.48, 0.07, 1.6],
  [0.85, 0.27, 0.08, 0.5],
  [0.52, 0.72, 0.075, 1.3],
  [0.71, 0.8, 0.07, 0.1],
  [0.17, 0.45, 0.08, 0.9],
  [0.1, 0.3, 0.065, 0.4],
];
const kirschbluete: Scene = {
  id: 'kirschbluete',
  name: 'Kirschblütenzweig',
  size: 22,
  palette: ['#faf1dd', '#6d8fb5', '#d9523d', '#33211f', '#ef99ac', '#b12c56'],
  mood: { top: '#efe3cb', bottom: '#8fa9c4', ink: '#33211f', root: 54 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.06 }),
    // Dunststreifen oben und unten, wie auf einem Holzschnitt
    cut(1, band(-0.05, 0.125, 0.012, 1.2, 0.5), 0, { angle: 90, amount: 0.25 }),
    cut(1, band(0.895, 1.05, 0.012, 1.4, 2.0), 0),
    cut(2, ellipse(0.6, 0.47, 0.3), 0.25),
    // Zweige: erst die dünnen, dann der Ast, der ihre Ansätze verdeckt
    cut(
      3,
      ribbon(
        [
          [0.38, 0.59],
          [0.47, 0.7],
          [0.62, 0.74],
          [0.8, 0.83],
        ],
        [0.04, 0.038, 0.03, 0.016],
      ),
      0.5,
    ),
    cut(
      3,
      ribbon(
        [
          [0.21, 0.71],
          [0.22, 0.56],
          [0.15, 0.42],
          [0.1, 0.3],
        ],
        [0.04, 0.034, 0.026, 0.014],
      ),
      0.5,
    ),
    cut(
      3,
      ribbon(
        [
          [0.56, 0.49],
          [0.58, 0.39],
          [0.54, 0.28],
        ],
        [0.036, 0.028, 0.014],
      ),
      0.5,
    ),
    cut(
      3,
      ribbon(
        [
          [-0.04, 0.84],
          [0.16, 0.74],
          [0.36, 0.6],
          [0.55, 0.5],
          [0.76, 0.36],
          [0.9, 0.22],
          [1.04, 0.16],
        ],
        [0.085, 0.075, 0.062, 0.052, 0.04, 0.03, 0.022],
      ),
      0.6,
    ),
    // Knospen sitzen an den Zweigen, drei halb offene Blüten an ihren Spitzen
    ...[
      [0.635, 0.705, 0.4],
      [0.19, 0.62, 1.3],
      [0.905, 0.275, 0.2],
      [0.6, 0.345, 1.0],
      [0.31, 0.585, 0.9],
    ].map(([x, y, rot]) => cut(5, ellipse(x, y, 0.03, 0.021, rot), 0.6)),
    ...[
      [0.535, 0.265, 0.052, 0.3],
      [0.815, 0.845, 0.052, 1.2],
      [0.955, 0.17, 0.05, 0.7],
    ].map(([x, y, r, rot]) => cut(5, flower(x, y, r, 5, rot, 0.62), 0.75)),
    ...blueten.map(([x, y, r, rot]) => cut(4, flower(x, y, r, 5, rot), 0.85)),
    ...blueten.map(([x, y, r]) => detail('#b12c56', ellipse(x, y, r * 0.2))),
    // drei Blütenblätter im Fallen
    cut(4, leaf(0.13, 0.945, 0.06, 0.035, 0.6), 0.3),
    cut(4, leaf(0.34, 0.92, 0.055, 0.032, -0.4), 0.3),
    cut(4, leaf(0.47, 0.86, 0.05, 0.03, 0.9), 0.3),
  ],
};

// ---------- Bergsee mit Boot ----------
const bergsee: Scene = {
  id: 'bergsee',
  name: 'Bergsee mit Boot',
  size: 24,
  palette: ['#f8dfa0', '#56608f', '#fbfaf5', '#215a43', '#58b7b7', '#d5452f'],
  mood: { top: '#f1d9a2', bottom: '#6fb5b5', ink: '#1d3d36', root: 51 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: -0.12 }),
    cut(2, ellipse(0.8, 0.13, 0.06), 0.2),
    // hinten der rechte Berg, davor der große linke; beide tragen Schnee
    cut(1, poly([0.4, 0.62], [0.66, 0.24], [0.73, 0.33], [0.8, 0.27], [1.02, 0.5], [1.02, 0.62]), 0.4, {
      angle: 90,
      amount: 0.2,
    }),
    cut(2, poly([0.66, 0.24], [0.73, 0.33], [0.7, 0.37], [0.66, 0.33], [0.62, 0.38], [0.595, 0.335]), 0.15),
    cut(
      1,
      poly([-0.02, 0.62], [-0.02, 0.5], [0.12, 0.42], [0.31, 0.13], [0.45, 0.36], [0.52, 0.32], [0.7, 0.62]),
      0.5,
      {
        angle: 90,
        amount: 0.2,
      },
    ),
    cut(2, poly([0.31, 0.13], [0.4, 0.28], [0.35, 0.31], [0.31, 0.26], [0.26, 0.33], [0.225, 0.26]), 0.15),
    // Waldgürtel am Ufer
    cut(3, band(0.565, 0.66, 0.008, 2.4, 0.6), 0.4),
    ...[
      [0.05, 0.11, 0.06],
      [0.13, 0.14, 0.07],
      [0.21, 0.1, 0.055],
      [0.3, 0.13, 0.065],
      [0.56, 0.1, 0.055],
      [0.64, 0.13, 0.065],
      [0.72, 0.1, 0.055],
      [0.93, 0.14, 0.07],
    ].map(([x, h, w]) => cut(3, fir(x, 0.585, h, w), 0.4)),
    // Bootshaus
    cut(2, rect(0.8, 0.555, 0.88, 0.63), 0.5),
    cut(5, poly([0.785, 0.56], [0.84, 0.5], [0.895, 0.56]), 0.6),
    // der See
    cut(4, band(0.63, 1.05, 0.004, 2, 0.3), 0.3, { angle: 90, amount: 0.2 }),
    detail('#fbfaf5', ellipse(0.3, 0.7, 0.12, 0.004)),
    detail('#fbfaf5', ellipse(0.72, 0.76, 0.1, 0.004)),
    detail('#fbfaf5', ellipse(0.2, 0.9, 0.09, 0.004)),
    // das Boot
    cut(5, poly([0.44, 0.8], [0.7, 0.8], [0.655, 0.86], [0.485, 0.86]), 0.7),
    detail('#fbfaf5', rect(0.458, 0.808, 0.682, 0.816)),
    detail('#fbfaf5', ellipse(0.57, 0.885, 0.11, 0.005)),
    // vorn das Ufer mit zwei hohen Tannen
    cut(3, ridge({ y: 0.97, amp: 0.02, waves: 1.2, phase: 0.4, rough: 0.3, tilt: 0.1 }), 0.7),
    cut(3, fir(0.07, 0.99, 0.5, 0.17), 0.8),
    cut(3, fir(0.2, 1.0, 0.36, 0.13), 0.8),
  ],
};

// ---------- Lavendelfeld ----------
/** Die Reihen laufen auf einen Punkt am Horizont zu. Jede hat eine helle Seite und eine Schattenseite. */
const fluchtpunkt: [number, number] = [0.6, 0.41];
const reihen: Layer[] = [];
for (let k = 0; k < 9; k++) {
  const x = -0.92 + k * 0.32;
  reihen.push(cut(2, poly(fluchtpunkt, [x + 0.32, 1.06], [x + 0.19, 1.06]), 0.15));
}
const lavendel: Scene = {
  id: 'lavendel',
  name: 'Lavendelfeld',
  size: 26,
  palette: ['#f7d893', '#b79be6', '#5b3f99', '#82a66e', '#234a3a', '#fdf6e7', '#c45436'],
  mood: { top: '#7968a6', bottom: '#4d3d78', ink: '#fdf6e7', root: 52 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: -0.1 }),
    cut(5, ellipse(0.79, 0.15, 0.08), 0.2),
    cut(3, ridge({ y: 0.35, amp: 0.035, waves: 1.2, phase: 0.5, rough: 0.2 }), 0.3, { angle: 90, amount: 0.15 }),
    cut(1, band(0.43, 1.06, 0.004, 1, 0), 0.3, { angle: 90, amount: 0.12 }),
    ...reihen,
    // Hecke am Horizont, davor Hof und Zypressen
    cut(4, band(0.395, 0.455, 0.008, 3, 0.4), 0.5),
    cut(4, blob(0.88, 0.4, 0.075, { seed: 4, squash: 0.8 }), 0.5),
    cut(4, leaf(0.58, 0.32, 0.22, 0.052, Math.PI / 2), 0.6),
    cut(4, leaf(0.645, 0.355, 0.16, 0.044, Math.PI / 2), 0.6),
    cut(5, rect(0.4, 0.385, 0.5, 0.445), 0.55),
    cut(6, poly([0.385, 0.392], [0.41, 0.35], [0.49, 0.35], [0.515, 0.392]), 0.6),
    cut(5, rect(0.16, 0.345, 0.4, 0.445), 0.6),
    cut(6, poly([0.135, 0.352], [0.19, 0.272], [0.37, 0.272], [0.425, 0.352]), 0.7),
    detail('#234a3a', rect(0.265, 0.39, 0.297, 0.445)),
    detail('#234a3a', rect(0.195, 0.378, 0.225, 0.405)),
    detail('#234a3a', rect(0.335, 0.378, 0.365, 0.405)),
    detail('#234a3a', rect(0.44, 0.405, 0.462, 0.428)),
  ],
};

// ---------- Pilze im Moos ----------
const pilze: Scene = {
  id: 'pilze',
  name: 'Pilze im Moos',
  size: 28,
  palette: ['#16302a', '#47895c', '#a4c465', '#c2331e', '#f8f0dc', '#7a8fd6'],
  mood: { top: '#16302a', bottom: '#2f5a40', ink: '#f4ecd6', root: 48 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: -0.1 }),
    // große Blätter im Hintergrund, jedes mit einer Mittelrippe
    cut(1, leaf(0.1, 0.36, 0.52, 0.19, -1.1, 0.06), 0.2),
    cut(1, leaf(0.93, 0.3, 0.54, 0.2, -2.0, -0.06), 0.2),
    cut(1, leaf(0.66, 0.2, 0.38, 0.13, -1.45), 0.2),
    cut(1, leaf(0.33, 0.13, 0.3, 0.1, -1.8, 0.04), 0.2),
    detail(
      '#356b48',
      ribbon(
        [
          [0.2, 0.15],
          [0.13, 0.3],
          [0.02, 0.56],
        ],
        0.006,
      ),
    ),
    detail(
      '#356b48',
      ribbon(
        [
          [0.83, 0.07],
          [0.9, 0.24],
          [1.0, 0.5],
        ],
        0.006,
      ),
    ),
    detail(
      '#356b48',
      ribbon(
        [
          [0.68, 0.03],
          [0.66, 0.2],
          [0.64, 0.37],
        ],
        0.005,
      ),
    ),
    detail(
      '#356b48',
      ribbon(
        [
          [0.3, 0.0],
          [0.325, 0.12],
          [0.36, 0.255],
        ],
        0.005,
      ),
    ),
    cut(1, ridge({ y: 0.7, amp: 0.035, waves: 1.3, phase: 1.0, rough: 0.35 }), 0.4, { angle: 90, amount: 0.2 }),
    // großer Pilz
    cut(
      4,
      ribbon(
        [
          [0.41, 0.92],
          [0.4, 0.74],
          [0.42, 0.54],
        ],
        [0.12, 0.085, 0.075],
      ),
      0.6,
      { angle: 0, amount: -0.12 },
    ),
    detail('#e6d9bb', ellipse(0.42, 0.535, 0.2, 0.035)),
    cut(3, dome(0.42, 0.53, 0.25, 0.21), 0.9, { angle: 90, amount: -0.2 }),
    ...[
      [0.33, 0.43, 0.03],
      [0.45, 0.38, 0.034],
      [0.56, 0.46, 0.028],
      [0.24, 0.49, 0.024],
      [0.4, 0.48, 0.022],
    ].map(([x, y, r]) => cut(4, ellipse(x, y, r, r * 0.85), 0.1)),
    // mittlerer Pilz
    cut(
      4,
      ribbon(
        [
          [0.77, 0.93],
          [0.78, 0.78],
          [0.77, 0.66],
        ],
        [0.08, 0.06, 0.052],
      ),
      0.6,
    ),
    detail('#e6d9bb', ellipse(0.77, 0.655, 0.115, 0.022)),
    cut(3, dome(0.77, 0.65, 0.145, 0.12), 0.9, { angle: 90, amount: -0.2 }),
    ...[
      [0.72, 0.6, 0.022],
      [0.8, 0.565, 0.024],
      [0.86, 0.62, 0.018],
    ].map(([x, y, r]) => cut(4, ellipse(x, y, r, r * 0.85), 0.1)),
    // kleiner Pilz
    cut(4, capsule(0.17, 0.93, 0.175, 0.8, 0.05), 0.6),
    cut(3, dome(0.175, 0.81, 0.09, 0.08), 0.9),
    cut(4, ellipse(0.16, 0.775, 0.018), 0.1),
    cut(4, ellipse(0.21, 0.79, 0.015), 0.1),
    // Moos im Vordergrund
    cut(2, ridge({ y: 0.9, amp: 0.03, waves: 1.8, phase: 0.3, rough: 0.4 }), 0.7, { angle: 90, amount: -0.15 }),
    // Glockenblumen
    ...[
      [0.58, 0.83, 0.042, 0.3],
      [0.3, 0.87, 0.038, 1.0],
      [0.93, 0.86, 0.04, 0.6],
      [0.05, 0.86, 0.036, 0.1],
      [0.64, 0.93, 0.034, 1.4],
    ].map(([x, y, r, rot]) => cut(5, flower(x, y, r, 5, rot), 0.8)),
    ...[
      [0.58, 0.83],
      [0.3, 0.87],
      [0.93, 0.86],
      [0.05, 0.86],
      [0.64, 0.93],
    ].map(([x, y]) => detail('#f8f0dc', ellipse(x, y, 0.009))),
  ],
};

// ---------- Leuchtturm im Zwielicht ----------
const leuchtturm: Scene = {
  id: 'leuchtturm',
  name: 'Leuchtturm im Zwielicht',
  size: 28,
  palette: ['#7b88b8', '#1b4b57', '#f6f2e6', '#c93f33', '#f6d98a', '#0b0f17'],
  mood: { top: '#3f4a78', bottom: '#16404c', ink: '#f6f2e6', root: 50 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.3 }),
    ...[
      [0.12, 0.3],
      [0.3, 0.38],
      [0.86, 0.1],
      [0.93, 0.3],
      [0.8, 0.42],
      [0.45, 0.08],
    ].map(([x, y]) => detail('#f6f2e6', ellipse(x, y, 0.005))),
    // letztes Licht am Horizont, darüber der Lichtkegel
    cut(4, band(0.49, 0.62, 0.006, 1.2, 0.4), 0, { angle: 90, amount: -0.2 }),
    cut(4, poly([0.66, 0.25], [-0.02, 0.06], [-0.02, 0.2]), 0.1),
    cut(1, band(0.6, 1.05, 0.006, 2.2, 1.0), 0.4, { angle: 90, amount: -0.15 }),
    detail('#7b88b8', ellipse(0.2, 0.68, 0.1, 0.004)),
    detail('#7b88b8', ellipse(0.3, 0.79, 0.12, 0.004)),
    // Felsen, kantig geschnitten
    cut(
      5,
      poly(
        [0.2, 1.02],
        [0.27, 0.9],
        [0.33, 0.87],
        [0.37, 0.79],
        [0.46, 0.765],
        [0.58, 0.77],
        [0.75, 0.765],
        [0.83, 0.8],
        [0.9, 0.79],
        [0.96, 0.84],
        [1.02, 0.86],
        [1.02, 1.02],
      ),
      0.6,
    ),
    // Wärterhaus, reicht bis hinter den Turm
    cut(2, rect(0.4, 0.685, 0.61, 0.775), 0.6),
    cut(3, poly([0.38, 0.69], [0.5, 0.615], [0.62, 0.69]), 0.7),
    detail('#f6d98a', rect(0.44, 0.715, 0.475, 0.75)),
    // Turm mit zwei roten Bändern, Umgang, Laterne, Dach
    cut(2, poly([0.585, 0.78], [0.615, 0.3], [0.705, 0.3], [0.735, 0.78]), 0.8, { angle: 0, amount: -0.12 }),
    cut(3, poly([0.61, 0.38], [0.71, 0.38], [0.716, 0.47], [0.604, 0.47]), 0.1),
    cut(3, poly([0.597, 0.58], [0.723, 0.58], [0.729, 0.67], [0.591, 0.67]), 0.1),
    cut(5, rect(0.593, 0.285, 0.727, 0.31), 0.8),
    cut(4, rect(0.625, 0.21, 0.695, 0.285), 0.5),
    cut(3, dome(0.66, 0.215, 0.052, 0.06), 0.8),
    detail('#0b0f17', rect(0.657, 0.21, 0.663, 0.285)),
    detail('#0b0f17', rect(0.657, 0.13, 0.663, 0.16)),
    // eine Welle vorn, die den Fuß der Felsen verdeckt
    cut(1, ridge({ y: 0.955, amp: 0.014, waves: 2.3, phase: 2.0, rough: 0.25 }), 0.5),
    detail('#7b88b8', ellipse(0.14, 0.93, 0.08, 0.004)),
  ],
};

// ---------- Wal unter Sternen ----------
const wal: Scene = {
  id: 'wal',
  name: 'Wal unter Sternen',
  size: 30,
  palette: ['#3b2a63', '#3fa08f', '#1d5c66', '#0c1020', '#f7efd8', '#e8833a'],
  mood: { top: '#2b1f4d', bottom: '#1d5c66', ink: '#f7efd8', root: 49 },
  layers: [
    cut(0, 'full', 0, { angle: 90, amount: 0.25 }),
    ...[
      [0.08, 0.07],
      [0.2, 0.17],
      [0.33, 0.06],
      [0.47, 0.14],
      [0.6, 0.05],
      [0.68, 0.19],
      [0.93, 0.22],
      [0.4, 0.22],
      [0.12, 0.24],
    ].map(([x, y]) => detail('#f7efd8', ellipse(x, y, 0.005))),
    detail('#f7efd8', blossom(0.27, 0.11, 0.018, 4, 0, 0.3)),
    detail('#f7efd8', blossom(0.55, 0.2, 0.015, 4, 0, 0.3)),
    cut(4, crescent(0.83, 0.12, 0.065, 0.28, 0.5), 0.3),
    // die See: oben hell, in der Tiefe dunkler
    cut(1, ridge({ y: 0.3, amp: 0.014, waves: 3.2, phase: 0.5, rough: 0.2 }), 0.4, { angle: 90, amount: 0.15 }),
    cut(2, ridge({ y: 0.67, amp: 0.03, waves: 1.2, phase: 2.2, rough: 0.2 }), 0.3, { angle: 90, amount: 0.3 }),
    // ein kleines Boot mit Laterne
    cut(5, poly([0.19, 0.272], [0.35, 0.272], [0.32, 0.318], [0.22, 0.318]), 0.5),
    detail('#f7efd8', rect(0.268, 0.2, 0.274, 0.275)),
    detail('#ffe9a6', ellipse(0.271, 0.195, 0.012)),
    // Luftblasen
    detail('#bfe3d6', arc(0.1, 0.43, 0.012, 0.004)),
    detail('#bfe3d6', arc(0.075, 0.385, 0.008, 0.003)),
    detail('#bfe3d6', arc(0.115, 0.36, 0.006, 0.003)),
    // Schwanzflosse, Leib, Bauch, Brustflosse
    cut(3, leaf(0.885, 0.545, 0.17, 0.065, -0.95, 0.05), 0.7),
    cut(3, leaf(0.895, 0.65, 0.15, 0.06, 0.6, -0.05), 0.7),
    cut(
      3,
      ribbon(
        [
          [0.17, 0.555],
          [0.28, 0.525],
          [0.43, 0.51],
          [0.58, 0.535],
          [0.72, 0.58],
          [0.83, 0.6],
        ],
        [0.17, 0.225, 0.24, 0.18, 0.09, 0.045],
      ),
      0.8,
      { angle: 90, amount: -0.25 },
    ),
    cut(
      4,
      ribbon(
        [
          [0.125, 0.6],
          [0.2, 0.6],
          [0.3, 0.59],
          [0.43, 0.582],
          [0.56, 0.59],
          [0.68, 0.607],
        ],
        [0.03, 0.062, 0.08, 0.08, 0.055, 0],
      ),
      0.1,
    ),
    cut(3, leaf(0.385, 0.675, 0.2, 0.06, 0.55, 0.04), 0.8),
    detail('#f7efd8', ellipse(0.215, 0.535, 0.011)),
    detail('#0c1020', ellipse(0.217, 0.536, 0.005)),
    // Fische
    ...[
      [0.13, 0.8, 0.2],
      [0.25, 0.87, -0.1],
      [0.37, 0.81, 0.15],
      [0.48, 0.9, -0.2],
      [0.61, 0.84, 0.1],
      [0.73, 0.91, 0],
      [0.85, 0.82, 0.25],
    ].flatMap(([x, y, rot]) => [
      cut(5, leaf(x, y, 0.09, 0.045, rot), 0.5),
      detail('#e8833a', poly([x + 0.035, y], [x + 0.066, y - 0.022], [x + 0.066, y + 0.022])),
    ]),
  ],
};

// ---------- Koi im Teich ----------
/**
 * Ein Koi von oben, der im Bogen um (cx, cy) schwimmt: vom Schwanz beim Winkel `from` zum Kopf beim Winkel `to`
 * (in Grad, 0 = rechts, 90 = unten). `marks` sind Flecken auf dem Rücken: Anfang, Ende (0 = Schwanz, 1 = Kopf), Farbe.
 */
function koi(
  cx: number,
  cy: number,
  radius: number,
  from: number,
  to: number,
  girth: number,
  body: number,
  marks: readonly (readonly [number, number, number])[],
): Layer[] {
  const profile = [0.24, 0.5, 0.8, 0.97, 1, 0.9, 0.62];
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const turn = Math.sign(to - from);
  const at = (t: number): [number, number] => {
    const a = rad(from + (to - from) * t);
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
  };
  /** Richtung, in die der Fisch an der Stelle t schwimmt */
  const heading = (t: number): number => rad(from + (to - from) * t) + (turn * Math.PI) / 2;
  const width = (t: number): number => {
    const x = t * (profile.length - 1);
    const k = Math.min(profile.length - 2, Math.floor(x));
    return girth * (profile[k] + (profile[k + 1] - profile[k]) * (x - k));
  };
  const stretch = (t0: number, t1: number, scale: number, n = 7) => {
    const spine: [number, number][] = [];
    const widths: number[] = [];
    for (let k = 0; k < n; k++) {
      const t = t0 + ((t1 - t0) * k) / (n - 1);
      spine.push(at(t));
      widths.push(width(t) * scale);
    }
    return ribbon(spine, widths);
  };
  const fin = (t: number, angle: number, length: number, wide: number): Layer => {
    const [x, y] = at(t);
    return cut(
      body,
      leaf(x + (Math.cos(angle) * length) / 2, y + (Math.sin(angle) * length) / 2, length, wide, angle),
      0.4,
    );
  };
  const back = heading(0) + Math.PI;
  const side = heading(0.74) + Math.PI;
  const [ex, ey] = at(0.93);
  const eye = heading(0.93) + Math.PI / 2;
  const off = width(0.93) * 0.3;
  return [
    fin(0.02, back - 0.42, girth * 1.5, girth * 0.5),
    fin(0.02, back + 0.42, girth * 1.5, girth * 0.5),
    fin(0.74, side - 1.0, girth * 1.25, girth * 0.48),
    fin(0.74, side + 1.0, girth * 1.25, girth * 0.48),
    cut(body, stretch(0, 1, 1), 0.7, { angle: 45, amount: -0.12 }),
    ...marks.map(([t0, t1, color]) => cut(color, stretch(t0, t1, 0.84, 5), 0.1)),
    detail('#0d2027', ellipse(ex + Math.cos(eye) * off, ey + Math.sin(eye) * off, girth * 0.07)),
    detail('#0d2027', ellipse(ex - Math.cos(eye) * off, ey - Math.sin(eye) * off, girth * 0.07)),
  ];
}
const teich: Scene = {
  id: 'koi',
  name: 'Koi im Teich',
  size: 32,
  palette: ['#0d2027', '#225f67', '#f8f4ea', '#d33d22', '#f1b452', '#639f52'],
  mood: { top: '#0d2027', bottom: '#225f67', ink: '#f8f4ea', root: 51 },
  layers: [
    cut(0, 'full', 0, { angle: 45, amount: 0.15 }),
    cut(1, ellipse(0.5, 0.5, 0.455, 0.405, 0.5), 0, { angle: 45, amount: 0.25 }),
    // Wellenringe
    detail('#3a7f86', arc(0.5, 0.5, 0.09, 0.006)),
    detail('#3a7f86', arc(0.5, 0.5, 0.15, 0.005, 0.3, 2.6)),
    detail('#3a7f86', arc(0.5, 0.5, 0.15, 0.005, 3.5, 5.6)),
    detail('#3a7f86', arc(0.19, 0.74, 0.06, 0.005)),
    detail('#3a7f86', arc(0.8, 0.25, 0.05, 0.005)),
    cut(5, lilyPad(0.1, 0.12, 0.12, 0.8), 0.5, { angle: 45, amount: -0.18 }),
    cut(5, lilyPad(0.91, 0.9, 0.14, 3.9), 0.5, { angle: 45, amount: -0.18 }),
    cut(5, lilyPad(0.7, 0.965, 0.055, 4.9), 0.5, { angle: 45, amount: -0.18 }),
    cut(5, lilyPad(0.08, 0.92, 0.075, 5.2), 0.5, { angle: 45, amount: -0.18 }),
    cut(5, lilyPad(0.93, 0.08, 0.06, 2.2), 0.5, { angle: 45, amount: -0.18 }),
    ...koi(0.5, 0.49, 0.27, 198, 346, 0.125, 2, [
      [0.84, 1, 3],
      [0.42, 0.66, 3],
      [0.12, 0.26, 3],
    ]),
    ...koi(0.5, 0.51, 0.255, 22, 166, 0.115, 4, [
      [0.5, 0.66, 2],
      [0.16, 0.28, 2],
    ]),
  ],
};

export const SCENES: readonly Scene[] = [
  mond,
  segelboot,
  ballon,
  nebel,
  wueste,
  kirschbluete,
  seerosen,
  birken,
  bergsee,
  lavendel,
  fuchs,
  pilze,
  leuchtturm,
  wal,
  teich,
];

export const sceneById = (id: string): Scene | undefined => SCENES.find((s) => s.id === id);
