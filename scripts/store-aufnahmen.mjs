// Erzeugt die Screenshots für den App Store aus dem Build in dist/:
//   npm run build && node scripts/store-aufnahmen.mjs [Sprachen, z. B. de,en]
// Format iPad 13 Zoll hochkant (2064 × 2752 Bildpunkte), je Sprache fünf Bilder in app-store/screenshots/<Sprache>/.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { webkit } from '@playwright/test';

const PORT = 4398;
const url = `http://localhost:${PORT}/`;
const languages = (process.argv[2] ?? 'en,de,it,fr,es').split(',');

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);
for (let k = 0; k < 50; k++) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}

const browser = await webkit.launch();
for (const language of languages) {
  const dir = `app-store/screenshots/${language}`;
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1032, height: 1376 },
    deviceScaleFactor: 2,
    hasTouch: true,
    locale: language,
  });
  const page = await context.newPage();
  // Sprache fest, Murmeln flink: So dauert das Vorspielen nicht lange.
  await page.addInitScript((language) => {
    if (!localStorage.getItem('murmel.v1')) localStorage.setItem('murmel.v1', JSON.stringify({ language, tempo: 3.2 }));
  }, language);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // In der App gibt es den Knopf „App installieren“ nicht.
  await page.addStyleTag({ content: '#install{display:none!important}' });
  const idle = () => page.waitForFunction(() => window.murmel.status()?.busy === false);
  const ids = await page.evaluate(() => window.murmel.ids());
  const shot = async (name) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${dir}/${name}.png` });
    console.log(`${dir}/${name}.png`);
  };
  /** Spielt Züge, bis höchstens `rest` Murmeln falsch liegen (oder `most` Züge gemacht sind). */
  const play = async (rest, most = 400) => {
    for (let k = 0; k < most; k++) {
      if ((await page.evaluate(() => window.murmel.status()?.remaining ?? 0)) <= rest) break;
      const move = await page.evaluate(() => window.murmel.next());
      if (!move) break;
      await page.mouse.click(move.select.x, move.select.y);
      await page.mouse.click(move.target.x, move.target.y);
      await idle();
    }
  };

  // 2: mitten im Spiel, eine Gruppe ist gewählt und ihre Löcher leuchten
  await page.evaluate((id) => window.murmel.open(id, true), ids[2]);
  await page.waitForTimeout(1200);
  const all = await page.evaluate(() => window.murmel.status()?.remaining ?? 0);
  await play(Math.round(all * 0.6));
  const move = await page.evaluate(() => window.murmel.next());
  if (move) await page.mouse.click(move.select.x, move.select.y);
  await page.mouse.move(5, 5);
  await shot('2-spiel');
  await page.mouse.click(5, 5);

  // 3: fast fertig, das Bild ist schon zu erkennen
  await page.evaluate((id) => window.murmel.open(id, true), ids[5]);
  await page.waitForTimeout(1200);
  const total = await page.evaluate(() => window.murmel.status()?.remaining ?? 0);
  await play(Math.round(total * 0.18), 900);
  await page.mouse.move(5, 5);
  await shot('3-fast-fertig');

  // 4: ein fertiges Bild
  await page.evaluate((id) => window.murmel.open(id, true), ids[1]);
  await page.evaluate(() => window.murmel.solve());
  await page.waitForFunction(() => window.murmel.status()?.finishShown === true);
  await shot('4-fertig');

  // einige Bilder fertig, damit die Sammlung Farbe zeigt
  for (const id of [ids[0], ids[3], ids[4], ids[7]]) {
    await page.evaluate((x) => window.murmel.open(x, true), id);
    await page.evaluate(() => window.murmel.solve());
    await page.waitForFunction(() => window.murmel.status()?.finishShown === true);
  }
  // 1: die Sammlung
  await page.evaluate(() => window.murmel.home());
  await shot('1-sammlung');

  // 5: die Einstellungen
  await page.locator('#homeSettings').click();
  await shot('5-einstellungen');
  await context.close();
}
await browser.close();
stop();
