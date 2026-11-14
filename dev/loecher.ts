// Entwicklungsansicht: die Entwürfe für das leere Feld als Musterblatt, jede Farbe neben ihrer Murmel
// (mit und ohne Spiegelung).
import { HOLE_NAMES, HOLE_STYLES, hole } from '../src/art/holes';
import { marble } from '../src/art/marble';
import { PAPER } from '../src/art/materials';
import { SCENES } from '../src/art/scenes';
import { mix } from '../src/core/color';

const out = document.getElementById('out') as HTMLElement;
const dpr = 2;

for (const scene of SCENES) {
  const title = document.createElement('h2');
  title.textContent = scene.name;
  const row = document.createElement('div');
  row.className = 'row';
  for (const style of HOLE_STYLES) {
    const sizes = [46, 27];
    const colors = scene.palette;
    const group = 4; // zwei Murmeln, zwei leere Felder
    const width = colors.length * group * sizes[0] + 20;
    const height = sizes[0] + sizes[1] + 34;
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const x = canvas.getContext('2d') as CanvasRenderingContext2D;
    x.scale(dpr, dpr);
    x.fillStyle = PAPER;
    x.fillRect(0, 0, width, height);
    let top = 10;
    for (const cell of sizes) {
      colors.forEach((color, k) => {
        const left = 10 + k * group * sizes[0];
        // unter allem die blasse Vorzeichnung
        x.fillStyle = mix(PAPER, color, 0.36);
        x.fillRect(left, top, cell * 4, cell);
        marble(x, left + cell / 2, top + cell / 2, cell * 0.82 * 0.48, color, k, 'glas');
        marble(x, left + cell * 1.5, top + cell / 2, cell * 0.82 * 0.48, color, k, 'matt');
        hole(x, left + cell * 2.5, top + cell / 2, cell, color, style);
        hole(x, left + cell * 3.5, top + cell / 2, cell, color, style);
      });
      top += cell + 14;
    }
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = HOLE_NAMES[style];
    figure.append(canvas, caption);
    row.append(figure);
  }
  out.append(title, row);
}
