// Entwicklungsansicht: jedes Motiv als Gemälde und als Murmelraster, mit Kennzahlen zur Palette.
import { paintScene } from '../src/art/paint';
import { SCENES } from '../src/art/scenes';
import { chroma, minDeltaE, minDeltaEFor } from '../src/core/color';
import { colorShares, sceneLevel } from '../src/core/scene';

const out = document.getElementById('out') as HTMLElement;
for (const scene of SCENES) {
  const row = document.createElement('div');
  row.className = 'row';
  const painting = paintScene(scene, 720);
  painting.style.width = '360px';
  const level = sceneLevel(scene);
  const n = scene.size;
  const cell = Math.floor(360 / n);
  const grid = document.createElement('canvas');
  grid.width = grid.height = cell * n;
  const g = grid.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#111';
  g.fillRect(0, 0, grid.width, grid.height);
  level.target.forEach((c, i) => {
    if (c < 0) return;
    g.fillStyle = scene.palette[c];
    g.beginPath();
    g.arc(((i % n) + 0.5) * cell, (Math.floor(i / n) + 0.5) * cell, cell * 0.44, 0, 7);
    g.fill();
  });
  const shares = colorShares(level).map((s, k) => `${scene.palette[k]} ${(s * 100).toFixed(0)} %`);
  const de = minDeltaE(scene.palette);
  const weak = (['protan', 'deutan', 'tritan'] as const)
    .map((v) => `${v} ${minDeltaEFor(scene.palette, v).value.toFixed(1)}`)
    .join(' · ');
  const vivid = scene.palette.map((c) => chroma(c).toFixed(0)).join(' · ');
  const cap = (el: HTMLElement, text: string) => {
    const f = document.createElement('figure');
    const c = document.createElement('figcaption');
    c.textContent = text;
    f.append(el, c);
    return f;
  };
  row.append(
    cap(painting, `${scene.name} (${n} × ${n})`),
    cap(
      grid,
      `Anteile: ${shares.join(' · ')} — kleinster Farbabstand ΔE ${de.value.toFixed(1)} (${de.pair.join(' / ')}) — bei Farbfehlsichtigkeit: ${weak} — Buntheit: ${vivid}`,
    ),
  );
  out.append(row);
}
