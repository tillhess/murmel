// Macht aus dem Build (dist/index.html) die eingebettete Einzeldatei dist/artifact.html.
//
// Die Zielumgebung setzt <!doctype>, <html>, <head> und <body> selbst und lädt nur wenige fremde Quellen:
// Skripte und Styles müssen eingebettet sein, Schriften dürfen von Google Fonts kommen. Manifest, Icons und
// andere Verweise auf Nachbardateien gibt es dort nicht, sie werden deshalb weggelassen.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
const all = (source, re) => [...source.matchAll(re)].map((m) => m[0]);

const title = head.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>Murmel</title>';
const fonts = all(head, /<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/g);
const styles = all(head, /<style[\s\S]*?<\/style>/g);
const scripts = all(head, /<script[\s\S]*?<\/script>/g);

// Die Zielumgebung hält oben und unten selbst Abstand zu den Rändern des Geräts. Die eigenen Abstände des Spiels
// kämen sonst doppelt dazu.
const insets = '<style>:root{--inset-top:0px;--inset-bottom:0px}</style>';

const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  ...fonts,
  ...styles,
  insets,
  body.trim(),
  ...scripts,
].join('\n');

const external = all(
  out,
  /<(?:script|link)[^>]+(?:src|href)=["'](?!https:\/\/fonts\.(?:googleapis|gstatic)\.com)[^"']+["'][^>]*>/g,
);
if (external.length) {
  console.error(`Die Einzeldatei verweist noch auf fremde Dateien:\n${external.join('\n')}`);
  process.exit(1);
}
writeFileSync('dist/artifact.html', out);
console.log(`dist/artifact.html geschrieben (${(out.length / 1024).toFixed(0)} kB)`);
