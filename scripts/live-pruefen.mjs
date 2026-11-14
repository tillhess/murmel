// Prüft die ausgelieferte Seite so, wie ein iPad sie sähe (WebKit im iPad-Format):
//   node scripts/live-pruefen.mjs [Adresse] [Ordner für Aufnahmen]
// Die Seite muss antworten, die Sammlung zeigen, sich spielen lassen und darf dabei nichts von fremden Servern laden.
// Endet mit Fehlercode 1, wenn etwas davon nicht stimmt.
import { devices, webkit } from '@playwright/test';

const url = process.argv[2] ?? 'https://tillhess.github.io/murmel/';
const shots = process.argv[3];
const problems = [];
const check = (ok, text) => {
  console.log(`${ok ? '✓' : '✗'} ${text}`);
  if (!ok) problems.push(text);
};

const browser = await webkit.launch();
const context = await browser.newContext({ ...devices['iPad Pro 11'], viewport: { width: 1194, height: 834 } });
const page = await context.newPage();
const errors = [];
const hosts = new Set();
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('request', (r) => {
  const u = new URL(r.url());
  if (u.protocol.startsWith('http')) hosts.add(u.host);
});

const response = await page.goto(url, { waitUntil: 'networkidle' });
check(response?.status() === 200, `Die Seite antwortet (${response?.status()}): ${url}`);
check((await page.title()) === 'Murmel', 'Der Titel ist „Murmel“');
const prints = await page.locator('.print').count();
check(prints === 16, `Die Sammlung zeigt 15 Bilder und das leere Blatt (${prints} Karten)`);
const fonts = await page.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].map((f) => `${f.family} ${f.status}`);
});
check(
  fonts.length === 2 && fonts.every((f) => f.endsWith('loaded')),
  `Beide Schriften sind geladen (${fonts.join(', ')})`,
);
if (shots) await page.screenshot({ path: `${shots}/live-sammlung.png` });

// Einstellungen: drei Entwürfe für leere Felder, drei Stufen für den Klang
await page.locator('#homeSettings').click();
const holeChoices = await page.locator('#settings [data-part="holes"] .choice').allTextContents();
const soundChoices = await page.locator('#settings [data-part="sound"] .choice').allTextContents();
check(
  holeChoices.length >= 3 && holeChoices.includes('Schälchen'),
  `Die Einstellungen bieten Entwürfe für leere Felder an (${holeChoices.join(', ')})`,
);
check(soundChoices.length === 3, `Die Einstellungen bieten drei Klangstufen an (${soundChoices.join(', ')})`);
if (shots) await page.screenshot({ path: `${shots}/live-einstellungen.png` });
await page.locator('#settings [data-part="done"]').click();

await page.locator('.print').first().click();
await page.waitForTimeout(1500);
const before = await page.evaluate(() => window.murmel.status());
for (let k = 0; k < 3; k++) {
  const move = await page.evaluate(() => window.murmel.next());
  if (!move) break;
  await page.touchscreen.tap(move.select.x, move.select.y);
  await page.waitForTimeout(250);
  await page.touchscreen.tap(move.target.x, move.target.y);
  await page.waitForTimeout(2400);
}
const after = await page.evaluate(() => window.murmel.status());
check(
  Boolean(before && after) && (after.inTray !== before.inTray || after.remaining !== before.remaining),
  `Drei Züge per Fingertipp verändern das Bild (noch ${after?.remaining} offen, ${after?.inTray} auf dem Holzbrett)`,
);
if (shots) await page.screenshot({ path: `${shots}/live-spiel.png` });

for (const [path, expected] of [
  ['manifest.webmanifest', 200],
  ['impressum.html', 200],
  ['datenschutz.html', 200],
  ['icon-180.png', 200],
  ['icon-512.png', 200],
  ['artifact.html', 404], // die Einzeldatei zum Einbetten gehört nicht auf die öffentliche Seite
]) {
  const r = await context.request.get(new URL(path, url).href);
  check(r.status() === expected, `${path} antwortet mit ${r.status()} (erwartet ${expected})`);
}

const home = new URL(url).host;
const foreign = [...hosts].filter((h) => h !== home);
check(foreign.length === 0, `Nichts kommt von fremden Servern (angefragt: ${[...hosts].join(', ')})`);
check(errors.length === 0, `Keine Fehler in der Konsole${errors.length ? `: ${errors.join(' | ')}` : ''}`);

await browser.close();
if (problems.length) {
  console.error(`\n${problems.length} Punkt(e) stimmen nicht.`);
  process.exit(1);
}
console.log('\nAlles in Ordnung.');
