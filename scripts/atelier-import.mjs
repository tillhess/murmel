#!/usr/bin/env node
// Prüft einen freigegebenen Export der Murmelwerkstatt, bevor er ins Repository übernommen wird.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const quelle = process.argv[2];
if (!quelle) {
  console.error('Aufruf: node scripts/atelier-import.mjs <freigabe.json>');
  process.exit(1);
}
const motiv = JSON.parse(readFileSync(quelle, 'utf8'));
const fehler = (meldung) => {
  throw new Error(`Ungültige Werkstatt-Freigabe: ${meldung}`);
};
if (motiv.format !== 'murmel-atelier/v1') fehler('Format');
if (typeof motiv.name !== 'string' || !/^[\p{L}\p{N} _-]{1,80}$/u.test(motiv.name)) fehler('Name');
if (typeof motiv.releaseId !== 'string' || !/^[0-9a-f-]{36}$/i.test(motiv.releaseId)) fehler('Freigabe-ID');
if (!Number.isFinite(Date.parse(motiv.approvedAt))) fehler('Freigabezeitpunkt');
if (!Number.isInteger(motiv.preferredSize) || motiv.preferredSize < 1) fehler('bevorzugte Größe');
if (typeof motiv.original !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(motiv.original))
  fehler('Originalbild');
if (!Array.isArray(motiv.palette) || motiv.palette.length < 1 || motiv.palette.some((f) => !/^#[0-9a-f]{6}$/i.test(f)))
  fehler('Palette');
if (!Array.isArray(motiv.levels) || motiv.levels.length === 0) fehler('Spielstufen');
for (const [i, stufe] of motiv.levels.entries()) {
  if (!Number.isInteger(stufe.width) || !Number.isInteger(stufe.height) || stufe.width < 1 || stufe.height < 1)
    fehler(`Rastergröße in Stufe ${i + 1}`);
  if (
    !Array.isArray(stufe.target) ||
    stufe.target.length !== stufe.width * stufe.height ||
    stufe.target.some((v) => !Number.isInteger(v) || v < -1 || v >= motiv.palette.length)
  )
    fehler(`Zielfarben in Stufe ${i + 1}`);
}
const zielOrdner = join('public', 'atelier-freigaben');
const ziel = join(zielOrdner, `${motiv.releaseId}.json`);
if (existsSync(ziel)) {
  const alt = JSON.parse(readFileSync(ziel, 'utf8'));
  if (JSON.stringify(alt) !== JSON.stringify(motiv)) fehler('Freigabe-ID bereits mit anderem Inhalt vorhanden');
  console.log('Freigabe ist bereits unverändert vorhanden:', ziel);
  process.exit(0);
}
mkdirSync(zielOrdner, { recursive: true });
writeFileSync(ziel, `${JSON.stringify(motiv)}\n`, { flag: 'wx' });
console.log('Freigabe vollständig gespeichert:', ziel);
