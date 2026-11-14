import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

/** Zugang, den das Spiel für Tests bereitstellt (siehe src/app/app.ts). */
interface Murmel {
  ids(): string[];
  open(id: string, fresh?: boolean): boolean;
  solve(): void;
  next(): { select: { x: number; y: number }; target: { x: number; y: number } } | null;
  sound(): 'alles' | 'murmeln' | 'aus';
  status(): {
    id: string;
    solved: boolean;
    remaining: number;
    inTray: number;
    selected: number;
    busy: boolean;
    finishShown: boolean;
  } | null;
  home(): void;
}
declare global {
  interface Window {
    murmel: Murmel;
  }
}

const status = (page: Page) => page.evaluate(() => window.murmel.status());

/** Fängt Fehler der Seite ab: Ein Test soll scheitern, wenn in der Konsole etwas kaputtgeht. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

test.beforeEach(async ({ page }) => {
  // ohne Animationen: Murmeln kommen sofort an, die Tests bleiben schnell und stabil
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('Startseite zeigt die Sammlung mit allen Bildern', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.wordmark')).toContainText('murmel');
  await expect(page.locator('.print')).toHaveCount(6); // fünf Motive und das leere Blatt für ein eigenes Foto
  await expect(page.locator('.print').first()).toContainText('Mond über dem See');
  await expect(page.locator('.print.own')).toContainText('Eigenes Bild');
  // keine waagerechte Scrollleiste auf der Seite selbst
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Auf dem Tablet hängen alle Bilder auf einmal an der Wand, hoch wie quer', async ({ page }) => {
  for (const size of [
    { width: 834, height: 1194 },
    { width: 1194, height: 834 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/');
    const prints = page.locator('.print');
    await expect(prints).toHaveCount(6);
    for (let k = 0; k < 6; k++)
      await expect(prints.nth(k), `${size.width} × ${size.height}`).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.wordmark')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#homeSettings')).toBeInViewport({ ratio: 1 });
  }
});

test('Der Klang hat drei Stufen und merkt sich die gewählte', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('#homeSettings').click();
  const choices = page.locator('#settings [data-part="sound"] .choice');
  await expect(choices).toHaveText(['Alles', 'Nur Murmeln', 'Still']);
  await expect(choices.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await choices.nth(2).click();
  await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.murmel.sound())).toBe('aus');
  await page.locator('#settings [data-part="done"]').click();
  await expect(page.locator('#settings')).toBeHidden();

  await page.reload();
  // Im Spiel zeigt das Symbol dieselbe Stufe, und ein Tipp schaltet weiter.
  await page.locator('.print').first().click();
  const icon = page.locator('#sound');
  await expect(icon).toHaveAttribute('data-mode', 'aus');
  await icon.click();
  await expect(icon).toHaveAttribute('data-mode', 'alles');
  await expect(page.locator('#whisper')).toContainText('Klang an.');
  // Die Einstellungen zeigen, was das Symbol geschaltet hat.
  await page.locator('#playSettings').click();
  await expect(choices.nth(0)).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('In den Einstellungen wählt man, wie leere Felder aussehen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('#homeSettings').click();
  const sheet = page.locator('#settings');
  await expect(sheet).toBeVisible();
  const choices = sheet.locator('[data-part="holes"] .choice');
  await expect(choices).toHaveText(['Schälchen', 'Ring', 'Gestanzt']);
  await expect(choices.nth(0)).toHaveAttribute('aria-pressed', 'true'); // Voreinstellung
  await choices.nth(1).click();
  await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(choices.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await sheet.locator('[data-part="done"]').click();
  await expect(sheet).toBeHidden();

  // Die Wahl bleibt, und im Spiel führt das Symbol in der Leiste zu denselben Einstellungen.
  await page.reload();
  await page.locator('.print').first().click();
  await page.locator('#playSettings').click();
  await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true');
  // Ein Tipp neben das Blatt schließt es.
  await page.mouse.click(4, 4);
  await expect(sheet).toBeHidden();
  expect(errors).toEqual([]);
});

test('Passt eine Gruppe nicht ganz ins Ziel, bleibt der Rest gewählt', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('seerosen'));
  let rest = 0;
  for (let k = 0; k < 80 && rest === 0; k++) {
    const move = await page.evaluate(() => window.murmel.next());
    if (!move) break;
    await page.mouse.click(move.select.x, move.select.y);
    const chosen = (await status(page))?.selected ?? 0;
    expect(chosen).toBeGreaterThan(0);
    await page.mouse.click(move.target.x, move.target.y);
    rest = (await status(page))?.selected ?? 0;
    if (rest > 0) expect(rest).toBeLessThan(chosen);
  }
  expect(rest, 'in 80 Zügen blieb nie ein Rest übrig').toBeGreaterThan(0);
  // Ein Tipp daneben hebt die Auswahl auf.
  await page.mouse.click(4, 90);
  expect((await status(page))?.selected).toBe(0);
  expect(errors).toEqual([]);
});

test('Ein Zug besteht aus Auswählen und Ziel antippen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('.print').first().click();
  await expect(page.locator('#board')).toBeVisible();
  const before = await status(page);
  expect(before?.id).toBe('mond');
  expect(before?.remaining).toBe(256);
  expect(before?.inTray).toBe(0);

  // Am Anfang ist kein Loch frei: Der erste Zug legt eine Gruppe auf dem Holzbrett ab.
  const move = await page.evaluate(() => window.murmel.next());
  if (!move) throw new Error('kein Zug gefunden');
  await page.mouse.click(move.select.x, move.select.y);
  await page.mouse.click(move.target.x, move.target.y);
  await expect.poll(async () => (await status(page))?.inTray).toBeGreaterThan(0);

  // Der zweite Zug rollt Murmeln in die frei gewordenen Löcher: Das Bild wächst.
  const second = await page.evaluate(() => window.murmel.next());
  if (!second) throw new Error('kein zweiter Zug gefunden');
  await page.mouse.click(second.select.x, second.select.y);
  await page.mouse.click(second.target.x, second.target.y);
  await expect.poll(async () => (await status(page))?.remaining).toBeLessThan(256);

  // Rückgängig nimmt den Zug zurück.
  await page.locator('#undo').click();
  expect((await status(page))?.remaining).toBe(256);
  expect(errors).toEqual([]);
});

test('Ein Bild lässt sich zu Ende spielen und hängt danach fertig in der Sammlung', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('mond'));
  await page.evaluate(() => window.murmel.solve());
  await expect.poll(async () => (await status(page))?.solved).toBe(true);
  await expect(page.locator('#finish')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#finish')).toContainText('Das Bild ist fertig.');
  expect((await status(page))?.inTray).toBe(0);

  await page.locator('#onward').click();
  await expect(page.locator('.print').first()).toContainText('fertig');
  expect(errors).toEqual([]);
});

test('Ein angefangenes Bild wird nach dem Neuladen fortgesetzt', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('nebel'));
  const move = await page.evaluate(() => window.murmel.next());
  if (!move) throw new Error('kein Zug gefunden');
  await page.mouse.click(move.select.x, move.select.y);
  await page.mouse.click(move.target.x, move.target.y);
  await expect.poll(async () => (await status(page))?.inTray).toBeGreaterThan(0);
  const parked = (await status(page))?.inTray;

  await page.reload();
  await expect(page.locator('.print').nth(1)).toContainText('Nebelberge');
  await page.locator('.print').nth(1).click();
  await expect.poll(async () => (await status(page))?.inTray).toBe(parked);
});

test('Alle Bilder lassen sich öffnen und vollständig lösen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  const ids = await page.evaluate(() => window.murmel.ids());
  expect(ids.length).toBeGreaterThanOrEqual(5);
  for (const id of ids) {
    await page.evaluate((x) => window.murmel.open(x), id);
    await page.evaluate(() => window.murmel.solve());
    await expect.poll(async () => (await status(page))?.remaining, { message: id }).toBe(0);
    await page.evaluate(() => window.murmel.home());
  }
  expect(errors).toEqual([]);
});

test('Ein eigenes Foto wird zu einem spielbaren Bild', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  // Als Foto dient das App-Icon: orange Murmel vor blauem Grund
  await page.locator('#photo').setInputFiles('public/icon-512.png');
  await expect(page.locator('#board')).toBeVisible();
  await expect.poll(async () => (await status(page))?.id).toBe('eigenes');
  expect((await status(page))?.remaining).toBe(24 * 24);
  await page.evaluate(() => window.murmel.solve());
  await expect.poll(async () => (await status(page))?.remaining).toBe(0);
  expect(errors).toEqual([]);
});

test('Die Einzeldatei läuft eingebettet und ohne Speicher', async ({ page }) => {
  const errors = watchErrors(page);
  // Nachbau der Zielumgebung: Sie setzt Kopf und Rumpf selbst, hält oben und unten Abstand zum Geräterand
  // und sperrt den Speicher des Browsers (eine Seite ohne eigene Adresse darf nichts speichern).
  const fragment = readFileSync('dist/artifact.html', 'utf8');
  await page.setContent(
    `<!doctype html><html lang="de"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
     <style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}</style>
     </head><body>${fragment}</body></html>`,
  );
  await expect(page.locator('.print')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);

  await page.locator('.print').first().click();
  await expect(page.locator('#board')).toBeVisible();
  const move = await page.evaluate(() => window.murmel.next());
  if (!move) throw new Error('kein Zug gefunden');
  await page.mouse.click(move.select.x, move.select.y);
  await page.mouse.click(move.target.x, move.target.y);
  await expect.poll(async () => (await status(page))?.inTray).toBeGreaterThan(0);

  await page.evaluate(() => window.murmel.solve());
  await expect(page.locator('#finish')).toBeVisible({ timeout: 15_000 });
  await page.locator('#onward').click();
  await expect(page.locator('.print')).toHaveCount(6);
  expect(errors).toEqual([]);
});
