// Macht aus dem Build (dist/index.html) die eingebettete Einzeldatei dist/artifact.html.
//
// Die Zielumgebung setzt <!doctype>, <html>, <head> und <body> selbst und lädt so gut wie nichts von außen:
// Skripte, Styles und Schriften müssen eingebettet sein (das erledigt der Build). Manifest, Icons und andere
// Verweise auf Nachbardateien gibt es dort nicht, sie werden deshalb weggelassen.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
const all = (source, re) => [...source.matchAll(re)].map((m) => m[0]);

const title = head.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>Murmel</title>';
const styles = all(head, /<style[\s\S]*?<\/style>/g);
const scripts = all(head, /<script[\s\S]*?<\/script>/g);

// Die Zielumgebung hält oben und unten selbst Abstand zu den Rändern des Geräts. Die eigenen Abstände des Spiels
// kämen sonst doppelt dazu.
const insets = '<style>:root{--inset-top:0px;--inset-bottom:0px}</style>';

const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  ...styles,
  insets,
  body.trim(),
  ...scripts,
].join('\n');

// Nichts darf nach draußen zeigen: weder Verweise im HTML noch Adressen im eingebetteten Stylesheet.
const external = [
  ...all(out, /<(?:script|link)[^>]+(?:src|href)=["'][^"']+["'][^>]*>/g),
  ...all(styles.join('\n'), /url\((?!["']?data:)[^)]*\)/g),
];
if (external.length) {
  console.error(`Die Einzeldatei verweist noch auf fremde Dateien:\n${external.join('\n').slice(0, 2000)}`);
  process.exit(1);
}
writeFileSync('dist/artifact.html', out);
console.log(`dist/artifact.html geschrieben (${(out.length / 1024).toFixed(0)} kB)`);
