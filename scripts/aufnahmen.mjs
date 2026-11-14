// Macht Aufnahmen des Spiels in WebKit im iPad-Format (Hoch- und Querformat), um die Darstellung zu prüfen:
//   npm run build && npm run preview &   (Server auf Port 4173)
//   node scripts/aufnahmen.mjs <Zielordner>
import { devices, webkit } from '@playwright/test';

const out = process.argv[2] ?? 'test-results/aufnahmen';
const browser = await webkit.launch();
const tap = (page, p) => page.touchscreen.tap(p.x, p.y);

for (const [name, viewport] of Object.entries({
  hoch: { width: 834, height: 1194 },
  quer: { width: 1194, height: 834 },
})) {
  const context = await browser.newContext({ ...devices['iPad Pro 11'], viewport });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}-1-sammlung.png` });

  await page.evaluate(() => window.murmel.open('seerosen'));
  await page.waitForTimeout(1200);
  // ein paar echte Züge per Fingertipp
  for (let k = 0; k < 9; k++) {
    const move = await page.evaluate(() => window.murmel.next());
    if (!move) break;
    await tap(page, move.select);
    await page.waitForTimeout(250);
    if (k === 8) await page.screenshot({ path: `${out}/${name}-2-auswahl.png` });
    await tap(page, move.target);
    await page.waitForTimeout(k === 8 ? 450 : 2600);
  }
  await page.screenshot({ path: `${out}/${name}-3-kette.png` });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${name}-4-spiel.png` });

  await context.close();

  // Abschluss: ohne Bewegung zu Ende spielen und warten, bis die beiden Wege angeboten werden
  const calm = await browser.newContext({ ...devices['iPad Pro 11'], viewport, reducedMotion: 'reduce' });
  const end = await calm.newPage();
  await end.goto('http://localhost:4173/');
  await end.evaluate(() => window.murmel.open('fuchs'));
  await end.evaluate(() => window.murmel.solve());
  await end.waitForFunction(() => window.murmel.status()?.finishShown, null, { timeout: 20_000 });
  await end.waitForTimeout(2200);
  await end.screenshot({ path: `${out}/${name}-5-fertig.png` });
  await calm.close();
}
await browser.close();
console.log(`Aufnahmen in ${out}`);
