import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { SCENES } from '../src/art/scenes';
import { minDeltaE } from '../src/core/color';
import { rasterize } from '../src/core/scene';

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
    selectedOn: 'board' | 'tray' | null;
    trayActive: boolean;
    zoom: number;
    size: number;
    tray: number;
    busy: boolean;
    finishShown: boolean;
    tempo: number;
    colors: string[];
    flashingColors: number[];
    completedColors: number[];
    arrivingColors: number[];
  } | null;
  home(): void;
  /** eine Stelle auf dem Holz des Bretts, die keine Mulde trifft */
  wood(): { x: number; y: number };
  /** die kleinste noch nicht gewählte Gruppe falsch liegender Murmeln im Bild */
  group(): { x: number; y: number } | null;
  /** eine Murmel auf dem Holzbrett, deren Farbe gerade nicht im Bild gewählt ist */
  slot(): { x: number; y: number } | null;
  trayHole(): { x: number; y: number } | null;
  detail(size: number | null): void;
  tray(size: number): boolean;
}
declare global {
  interface Window {
    murmel: Murmel;
  }
}

const status = (page: Page) => page.evaluate(() => window.murmel.status());

/** So viele Motive bringt das Spiel mit. */
const MOTIFS = 15;
/** Blätter in der Sammlung: die Motive und das leere Blatt für ein eigenes Foto */
const PRINTS = MOTIFS + 1;

/** Fängt Fehler der Seite ab: Ein Test soll scheitern, wenn in der Konsole etwas kaputtgeht. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

/**
 * Zwei Finger, die sich um den Punkt (x, y) herum von `from` auf `to` Bildschirmpunkte Abstand spreizen
 * (oder zusammenziehen). Die Berührungen werden direkt an das Spielbrett gemeldet, wie es ein iPad täte.
 */
async function pinch(page: Page, x: number, y: number, from: number, to: number): Promise<void> {
  await page.evaluate(
    ({ x, y, from, to }) => {
      const board = document.getElementById('board') as HTMLElement;
      const fire = (type: string, id: number, half: number) =>
        board.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            isPrimary: id === 11,
            clientX: x + (id === 11 ? -half : half),
            clientY: y,
            bubbles: true,
          }),
        );
      fire('pointerdown', 11, from / 2);
      fire('pointerdown', 12, from / 2);
      for (let k = 1; k <= 8; k++) {
        const half = (from + ((to - from) * k) / 8) / 2;
        fire('pointermove', 11, half);
        fire('pointermove', 12, half);
      }
      fire('pointerup', 11, to / 2);
      fire('pointerup', 12, to / 2);
    },
    { x, y, from, to },
  );
}

test.beforeEach(async ({ page }) => {
  // ohne Animationen: Murmeln kommen sofort an, die Tests bleiben schnell und stabil
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('Startseite zeigt die Sammlung mit allen Bildern', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.wordmark')).toContainText('murmel');
  await expect(page.locator('.print')).toHaveCount(PRINTS);
  await expect(page.locator('.print').first()).toContainText('Mond über dem See');
  await expect(page.locator('.print.own')).toContainText('Eigenes Bild');
  // Die Seite selbst scrollt in keine Richtung, nur die Sammlung in sich.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  expect(errors).toEqual([]);
});

test('Auf dem Tablet hängen die Bilder an einer Wand, die scrollt, hoch wie quer', async ({ page }) => {
  for (const size of [
    { width: 834, height: 1194 },
    { width: 1194, height: 834 },
  ]) {
    const where = `${size.width} × ${size.height}`;
    await page.setViewportSize(size);
    await page.goto('/');
    const prints = page.locator('.print');
    await expect(prints).toHaveCount(PRINTS);
    // Die ersten beiden Reihen sind ganz zu sehen, das letzte Blatt hängt weiter unten.
    for (let k = 0; k < 6; k++) await expect(prints.nth(k), where).toBeInViewport({ ratio: 1 });
    await expect(prints.last(), where).not.toBeInViewport();
    await expect(page.locator('.wordmark')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#homeSettings')).toBeInViewport({ ratio: 1 });
    // Jeder Name passt in eine Zeile: Ein zweizeiliger machte sein Blatt höher als die Nachbarn.
    const wrapped = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.querySelectorAll('.print .print-name')]
        .filter((name) => {
          const range = document.createRange();
          range.selectNodeContents(name);
          return range.getClientRects().length > 1;
        })
        .map((name) => name.textContent);
    });
    expect(wrapped, where).toEqual([]);

    // Die Wand scrollt in sich. Am Ende hängt das letzte Blatt ganz im Bild und über dem weichen Auslauf.
    const shelf = page.locator('#shelf');
    await shelf.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(prints.last(), where).toBeInViewport({ ratio: 1 });
    const clear = await shelf.evaluate((el) => {
      const last = el.lastElementChild as HTMLElement;
      const fade = Number.parseFloat(getComputedStyle(el).paddingBottom);
      return { gap: el.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom, fade };
    });
    expect(clear.fade, where).toBeGreaterThan(40);
    expect(clear.gap, where).toBeGreaterThanOrEqual(clear.fade - 12); // ein schief hängendes Blatt ragt etwas tiefer
    await expect(prints.first(), where).not.toBeInViewport();
    // Name und Einstellungen bleiben stehen: Die Seite selbst ist nicht gescrollt.
    await expect(page.locator('.wordmark')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#homeSettings')).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  }
});

test('Nach einem Bild steht die Wand wieder dort, wo man sie verlassen hat', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto('/');
  const last = page.locator('.print:not(.own)').last();
  await expect(last).not.toBeInViewport();
  await last.click(); // der Tipp holt das Blatt erst ins Bild
  await expect(page.locator('#board')).toBeVisible();
  expect((await status(page))?.id).toBe(await last.getAttribute('data-id'));
  await page.locator('#back').click();
  await expect(last).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.print').first()).not.toBeInViewport();
  expect(errors).toEqual([]);
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
  await expect(choices).toHaveText(['Schälchen', 'Kreuz', 'Ring']);
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

test('Murmeln gibt es mit und ohne Spiegelung, und jeder Entwurf für leere Felder lässt sich spielen', async ({
  page,
}) => {
  test.slow(); // mehrere Entwürfe nacheinander: Der iPad-Browser auf dem Build-Server braucht dafür länger
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('#homeSettings').click();
  const marbles = page.locator('#settings [data-part="marbles"] .choice');
  await expect(marbles).toHaveText(['Mit Spiegelung', 'Ohne Spiegelung']);
  await expect(marbles.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await marbles.nth(1).click();
  await expect(marbles.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#settings [data-part="done"]').click();

  // Jeder Entwurf wird einmal gewählt und einen Zug lang gespielt: Dabei darf nichts kaputtgehen.
  await page.evaluate(() => window.murmel.open('mond'));
  const holes = page.locator('#settings [data-part="holes"] .choice');
  for (let k = 0; k < 3; k++) {
    await page.locator('#playSettings').click();
    await holes.nth(k).click();
    await expect(holes.nth(k)).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#settings [data-part="done"]').click();
    const move = await page.evaluate(() => window.murmel.next());
    if (!move) throw new Error('kein Zug gefunden');
    await page.mouse.click(move.select.x, move.select.y);
    await page.mouse.click(move.target.x, move.target.y);
  }
  expect((await status(page))?.remaining).toBeLessThanOrEqual(256);

  // Die Wahl der Murmeln bleibt nach dem Neuladen.
  await page.reload();
  await page.locator('#homeSettings').click();
  await expect(marbles.nth(1)).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('Bei vollem Holzbrett lässt sich trotz gewähltem Rest eine Farbe auf dem Brett wählen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('fuchs'));
  // Kleine Gruppen ablegen, bis das Holzbrett voll ist. Was nicht mehr passt, bleibt im Bild gewählt.
  const wood = await page.evaluate(() => window.murmel.wood());
  const nextGroup = async () => {
    const group = await page.evaluate(() => window.murmel.group());
    if (!group) throw new Error('keine Gruppe gefunden');
    return group;
  };
  for (let k = 0; k < 60 && ((await status(page))?.inTray ?? 0) < 30; k++) {
    const group = await nextGroup();
    await page.mouse.click(group.x, group.y);
    await page.mouse.click(wood.x, wood.y);
  }
  expect((await status(page))?.inTray).toBe(30);
  // Ging die letzte Gruppe genau auf, ist nichts mehr gewählt: Dann eine Gruppe wählen, die keinen Platz mehr hat.
  if ((await status(page))?.selected === 0) {
    const group = await nextGroup();
    await page.mouse.click(group.x, group.y);
  }
  expect((await status(page))?.selectedOn).toBe('board');

  // Früher kam hier bei jedem Tipp nur "Das Holzbrett ist voll". Jetzt gibt der Tipp die Auswahl im Bild auf,
  // und die Murmeln auf dem Brett sind wieder am Zug.
  const slot = await page.evaluate(() => window.murmel.slot());
  if (!slot) throw new Error('keine Murmel auf dem Holzbrett gefunden');
  await page.mouse.click(slot.x, slot.y);
  await expect(page.locator('#whisper')).not.toContainText('Das Holzbrett ist voll');
  const chosen = await status(page);
  expect(chosen?.selected).toBe(0);
  expect(chosen?.trayActive).toBe(true);
  // Der nächste Zug kommt vom Brett: ein Tipp auf ein Loch genügt. Je nach Aufstellung ist gerade kein Loch
  // für eine Farbe vom Brett frei; dann gibt es hier nichts zu prüfen.
  const hole = await page.evaluate(() => window.murmel.trayHole());
  if (hole) {
    await page.mouse.click(hole.x, hole.y);
    expect((await status(page))?.inTray).toBeLessThan(30);
  }
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
    await page.mouse.click(move.target.x, move.target.y);
    if (chosen === 0) continue; // ein Zug vom Holzbrett: Dort ist immer alles gewählt
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

/** Drei noch fehlende Murmeln; die beiden blauen Löcher liegen weit auseinander. */
async function almostFinished(page: Page): Promise<void> {
  const target = Array.from(rasterize(SCENES[0]));
  const blue = target.flatMap((color, cell) => (color === 0 ? [cell] : []));
  const cur = target.slice();
  for (const cell of [blue[0], blue[blue.length - 1], target.indexOf(1)]) cur[cell] = -1;
  await page.addInitScript(
    (progress) => {
      localStorage.setItem(
        'murmel.v1',
        JSON.stringify({ finished: [], progress: { mond: progress }, sound: 'aus', tempo: 0.45 }),
      );
    },
    { cur, tray: [0, 0, 1, ...Array(27).fill(-1)] },
  );
  await page.clock.install({ time: new Date('2026-11-15T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-15T12:00:01Z'));
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('mond', false));
  await page.clock.runFor(32);
}

test('Eine Farbe leuchtet erst nach der letzten Ankunft auf, auch bei überlappenden Zügen', async ({ page }) => {
  await almostFinished(page);
  expect((await status(page))?.completedColors).not.toContain(0);
  for (let move = 0; move < 2; move++) {
    if (!(await status(page))?.trayActive) {
      const wood = await page.evaluate(() => window.murmel.wood());
      await page.mouse.click(wood.x, wood.y);
    }
    const hole = await page.evaluate(() => window.murmel.trayHole());
    if (!hole) throw new Error('freies blaues Loch fehlt');
    await page.mouse.click(hole.x, hole.y);
  }
  // Logisch ist Blau jetzt fertig. Die Murmeln sind aber noch an ihren Startplätzen.
  expect((await status(page))?.remaining).toBe(1);
  expect((await status(page))?.flashingColors).toEqual([]);
  expect((await status(page))?.completedColors).not.toContain(0);
  let flashed = false;
  for (let step = 0; step < 40 && !flashed; step++) {
    await page.clock.runFor(200);
    const current = await status(page);
    flashed = current?.flashingColors.includes(0) ?? false;
    if (current?.arrivingColors.includes(0)) expect(flashed).toBe(false);
  }
  expect(flashed).toBe(true);
  await page.clock.runFor(800);
  expect((await status(page))?.flashingColors).toEqual([]);
  expect((await status(page))?.completedColors).toContain(0);
  expect(await page.evaluate(() => window.murmel.sound())).toBe('aus');

  await page.locator('#undo').click();
  expect((await status(page))?.completedColors).not.toContain(0);
  expect((await status(page))?.flashingColors).toEqual([]);
  await page.clock.runFor(1000);
  expect((await status(page))?.flashingColors).toEqual([]);
});

test('Reduzierte Bewegung unterdrückt den Farbblitz auch beim letzten Zug', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await almostFinished(page);
  await page.evaluate(() => window.murmel.solve());
  await page.clock.runFor(32);
  const done = await status(page);
  expect(done?.solved).toBe(true);
  expect(done?.flashingColors).toEqual([]);
  expect(done?.completedColors).toContain(0);
  expect(done?.completedColors).toContain(1);
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
  const print = page.locator('.print[data-id="nebel"]');
  await expect(print).toContainText('Nebelberge');
  await print.click();
  await expect.poll(async () => (await status(page))?.inTray).toBe(parked);
});

test('Alle Bilder lassen sich öffnen und vollständig lösen', async ({ page }) => {
  test.slow(); // 15 Bilder nacheinander: Der iPad-Browser auf dem Build-Server braucht dafür länger
  const errors = watchErrors(page);
  await page.goto('/');
  const ids = await page.evaluate(() => window.murmel.ids());
  expect(ids.length).toBe(MOTIFS);
  for (const id of ids) {
    await page.evaluate((x) => window.murmel.open(x), id);
    await page.evaluate(() => window.murmel.solve());
    await expect.poll(async () => (await status(page))?.remaining, { message: id, timeout: 20_000 }).toBe(0);
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
  await expect.poll(async () => (await status(page))?.id).toMatch(/^eigenes-/);
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
  await expect(page.locator('.print')).toHaveCount(PRINTS);
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
  await expect(page.locator('.print')).toHaveCount(PRINTS);
  expect(errors).toEqual([]);
});

test('Die Detailtiefe lässt sich für alle Bilder wählen, jede Größe hat ihren eigenen Stand', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.print').first()).toContainText('16 × 16');
  await page.locator('#homeSettings').click();
  const detail = page.locator('#settings [data-part="detail"] .choice');
  await expect(detail).toHaveText(['Wie gemalt', '16 × 16', '20 × 20', '24 × 24', '28 × 28', '36 × 36', '50 × 50']);
  await expect(detail.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await detail.nth(5).click();
  await page.locator('#settings [data-part="done"]').click();
  // Die Sammlung zeigt jetzt jedes Bild in der gewählten Größe.
  await expect(page.locator('.print').first()).toContainText('36 × 36');
  await expect(page.locator('.print').nth(4)).toContainText('36 × 36');

  await page.locator('.print').first().click();
  expect((await status(page))?.size).toBe(36);
  expect((await status(page))?.remaining).toBe(36 * 36);
  const move = await page.evaluate(() => window.murmel.next());
  if (!move) throw new Error('kein Zug gefunden');
  await page.mouse.click(move.select.x, move.select.y);
  await page.mouse.click(move.target.x, move.target.y);
  const parked = (await status(page))?.inTray ?? 0;
  expect(parked).toBeGreaterThan(0);

  // Im Spiel umgestellt, wechselt das offene Bild sofort die Größe. Der Stand der alten bleibt liegen.
  await page.locator('#playSettings').click();
  await detail.nth(0).click();
  await page.locator('#settings [data-part="done"]').click();
  expect((await status(page))?.size).toBe(16);
  expect((await status(page))?.inTray).toBe(0);
  await page.locator('#playSettings').click();
  await detail.nth(5).click();
  await page.locator('#settings [data-part="done"]').click();
  expect((await status(page))?.size).toBe(36);
  expect((await status(page))?.inTray).toBe(parked);
  expect(errors).toEqual([]);
});

test('Das Holzbrett lässt sich vergrößern und verkleinern', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('seerosen'));
  expect((await status(page))?.tray).toBe(30);
  await page.locator('#playSettings').click();
  const tray = page.locator('#settings [data-part="tray"] .choice');
  await expect(tray).toHaveText(['30', '45', '60', '90', '120']);
  await tray.nth(2).click();
  await expect(tray.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#settings [data-part="done"]').click();
  expect((await status(page))?.tray).toBe(60);

  // Mehr als 30 Murmeln ablegen: Danach passt das Brett nicht mehr auf 30 zurück, und das wird gesagt.
  const wood = await page.evaluate(() => window.murmel.wood());
  for (let k = 0; k < 80 && ((await status(page))?.inTray ?? 0) <= 30; k++) {
    const group = await page.evaluate(() => window.murmel.group());
    if (!group) throw new Error('keine Gruppe gefunden');
    await page.mouse.click(group.x, group.y);
    await page.mouse.click(wood.x, wood.y);
  }
  expect((await status(page))?.inTray).toBeGreaterThan(30);
  await page.locator('#playSettings').click();
  await tray.nth(0).click();
  await expect(page.locator('#settings [data-part="trayNote"]')).toBeVisible();
  await page.locator('#settings [data-part="done"]').click();
  expect((await status(page))?.tray).toBe(60);

  // Ein neues Bild beginnt mit der zuletzt gewählten Größe, auch nach dem Neuladen.
  await page.reload();
  await page.evaluate(() => window.murmel.open('mond'));
  expect((await status(page))?.tray).toBe(30);
  expect(errors).toEqual([]);
});

test('Das Bild lässt sich vergrößern, das Holzbrett bleibt dabei stehen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('fuchs'));
  const wood = await page.evaluate(() => window.murmel.wood());
  const first = await page.evaluate(() => window.murmel.group());
  if (!first) throw new Error('keine Gruppe gefunden');
  const board = await page.locator('#board').boundingBox();
  if (!board) throw new Error('kein Spielbrett');
  await expect(page.locator('#fit')).toBeHidden();

  // Zwei Finger spreizen sich über dem Bild.
  await pinch(page, first.x, first.y, 20, 160);
  await expect.poll(async () => (await status(page))?.zoom).toBeGreaterThan(1.5);
  await expect(page.locator('#fit')).toBeVisible();
  // Das Holzbrett liegt, wo es lag; die Stelle unter dem Zeiger ist dieselbe Murmel geblieben.
  expect(await page.evaluate(() => window.murmel.wood())).toEqual(wood);
  const zoomed = await page.evaluate(() => window.murmel.group());
  expect(Math.abs((zoomed?.x ?? 0) - first.x)).toBeLessThan(1);
  expect(Math.abs((zoomed?.y ?? 0) - first.y)).toBeLessThan(1);

  // Ziehen verschiebt das Bild und wählt nichts aus.
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  // Zur Bildmitte hin ziehen: So bleibt die Gruppe sicher im Rahmen, auch wenn sie am Rand liegt.
  const dx = first.x < board.x + board.width / 2 ? 60 : -60;
  const dy = first.y < board.y + board.height * 0.4 ? 40 : -40;
  await page.mouse.move(first.x + dx, first.y + dy, { steps: 4 });
  await page.mouse.up();
  expect((await status(page))?.selected).toBe(0);
  const moved = await page.evaluate(() => window.murmel.group());
  expect(Math.hypot((moved?.x ?? 0) - first.x, (moved?.y ?? 0) - first.y)).toBeGreaterThan(20);

  // Ein Tipp ohne Ziehen wählt die Murmel unter dem Finger, auch vergrößert.
  await page.mouse.click(moved?.x ?? 0, moved?.y ?? 0);
  expect((await status(page))?.selected).toBeGreaterThan(0);

  // Das Holzbrett nimmt die Gruppe wie immer auf.
  await page.mouse.click(wood.x, wood.y);
  expect((await status(page))?.inTray).toBeGreaterThan(0);

  await page.locator('#fit').click();
  expect((await status(page))?.zoom).toBe(1);
  await expect(page.locator('#fit')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Ein großes Bild mit 50 × 50 Murmeln lässt sich spielen und lösen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => {
    window.murmel.detail(50);
    window.murmel.tray(120);
    window.murmel.open('fuchs');
  });
  const begin = await status(page);
  expect(begin?.size).toBe(50);
  expect(begin?.tray).toBe(120);
  expect(begin?.remaining).toBe(2500);
  await page.evaluate(() => window.murmel.solve());
  await expect.poll(async () => (await status(page))?.remaining, { timeout: 20_000 }).toBe(0);
  await expect(page.locator('#finish')).toBeVisible({ timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('Mit dem Mausrad lässt sich das Bild ebenfalls vergrößern', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ein Tablet hat kein Mausrad');
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('fuchs'));
  const group = await page.evaluate(() => window.murmel.group());
  if (!group) throw new Error('keine Gruppe gefunden');
  await page.mouse.move(group.x, group.y);
  await page.mouse.wheel(0, -600);
  await expect.poll(async () => (await status(page))?.zoom).toBeGreaterThan(1.5);
  // Zwei Finger zusammengezogen bringen das ganze Bild zurück.
  await pinch(page, group.x, group.y, 200, 10);
  expect((await status(page))?.zoom).toBe(1);
});

test('Ein eigenes, angefangenes Bild bleibt in der Sammlung, bis man es entfernt', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('#photo').setInputFiles('public/icon-512.png');
  await expect(page.locator('#board')).toBeVisible();
  // zwei Züge: erst ablegen, dann die ersten Murmeln an ihren Platz
  for (let k = 0; k < 2; k++) {
    const move = await page.evaluate(() => window.murmel.next());
    if (!move) throw new Error('kein Zug gefunden');
    await page.mouse.click(move.select.x, move.select.y);
    await page.mouse.click(move.target.x, move.target.y);
  }
  const before = await status(page);
  expect(before?.remaining).toBeLessThan(24 * 24);

  // Zurück in der Sammlung hängt das eigene Bild neben den anderen, als begonnen markiert.
  await page.locator('#back').click();
  const mine = page.locator('.print-wrap');
  await expect(mine).toHaveCount(1);
  await expect(mine.locator('.print')).toContainText('Eigenes Bild');
  await expect(mine.locator('.print')).toContainText('begonnen');
  await expect(page.locator('.print.own')).toContainText('Noch ein Bild');

  // Auch nach dem Schließen und Wiederöffnen ist es da, und das Spiel geht dort weiter, wo es stand.
  await page.reload();
  await expect(mine).toHaveCount(1);
  await mine.locator('.print').click();
  const after = await status(page);
  expect(after?.id).toBe(before?.id);
  expect(after?.remaining).toBe(before?.remaining);
  expect(after?.inTray).toBe(before?.inTray);

  // Entfernen fragt erst nach und nimmt das Bild dann aus der Sammlung, dauerhaft.
  await page.locator('#back').click();
  const remove = mine.locator('.print-remove');
  await remove.click();
  await expect(remove).toHaveText('entfernen?');
  await expect(mine).toHaveCount(1);
  await remove.click();
  await expect(mine).toHaveCount(0);
  await expect(page.locator('.print')).toHaveCount(PRINTS);
  await page.reload();
  await expect(page.locator('.print')).toHaveCount(PRINTS);
  await expect(mine).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Die Farben eines eigenen Fotos lassen sich stärker voneinander abheben', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('#photo').setInputFiles('public/icon-512.png');
  await expect.poll(async () => (await status(page))?.id).toMatch(/^eigenes-/);
  // ein Zug, damit es einen Stand gibt, der das Umfärben überstehen muss
  const move = await page.evaluate(() => window.murmel.next());
  if (move) {
    await page.mouse.click(move.select.x, move.select.y);
    await page.mouse.click(move.target.x, move.target.y);
  }
  await expect.poll(async () => (await status(page))?.busy).toBe(false);
  const before = await status(page);
  const gap = (colors: string[] = []) => minDeltaE(colors).value;

  await page.locator('#playSettings').click();
  const choices = page.locator('#settings [data-part="contrast"] .choice');
  await expect(choices).toHaveText(['Naturnah', 'Deutlich', 'Kräftig']);
  await expect(choices.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await choices.nth(2).click();
  await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#settings [data-part="done"]').click();

  const after = await status(page);
  expect(after?.colors).not.toEqual(before?.colors);
  expect(after?.colors.length).toBe(before?.colors.length);
  expect(gap(after?.colors)).toBeGreaterThan(gap(before?.colors));
  // die Murmeln liegen, wo sie lagen
  expect(after?.remaining).toBe(before?.remaining);
  expect(after?.inTray).toBe(before?.inTray);

  // die Wahl gilt auch nach dem Neuladen
  await page.reload();
  await page.locator('.print-wrap .print').click();
  await expect.poll(async () => (await status(page))?.colors).toEqual(after?.colors);
  expect((await status(page))?.remaining).toBe(before?.remaining);
  expect(errors).toEqual([]);
});

test('Ein Regler stellt das Tempo der Murmeln ein', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('mond'));
  const slider = page.locator('#settings [data-part="tempo"]');
  const setTempo = async (step: number): Promise<void> => {
    await page.locator('#playSettings').click();
    await slider.fill(String(step));
    await page.locator('#settings [data-part="done"]').click();
  };
  await page.locator('#playSettings').click();
  await expect(slider).toHaveValue('2'); // Voreinstellung in der Mitte
  await page.locator('#settings [data-part="done"]').click();

  expect((await status(page))?.tempo).toBe(1);
  await setTempo(0);
  const slow = (await status(page))?.tempo ?? 1;
  expect(slow).toBeLessThan(1);
  await setTempo(5);
  const fast = (await status(page))?.tempo ?? 1;
  expect(fast).toBeGreaterThan(2);
  // auch im schnellsten Tempo lässt sich spielen
  const move = await page.evaluate(() => window.murmel.next());
  if (!move) throw new Error('kein Zug gefunden');
  await page.mouse.click(move.select.x, move.select.y);
  await page.mouse.click(move.target.x, move.target.y);
  await expect.poll(async () => (await status(page))?.busy).toBe(false);

  // die Wahl bleibt nach dem Neuladen
  await page.reload();
  await page.locator('#homeSettings').click();
  await expect(slider).toHaveValue('5');
  expect(errors).toEqual([]);
});

test('Murmel lässt sich als App installieren und läuft danach ohne Netz', async ({ page, context, browserName }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.print')).toHaveCount(PRINTS);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);

  if (browserName === 'webkit') {
    // iPad: Safari fragt nicht selbst, der Knopf zeigt den Weg über das Teilen-Menü.
    await page.locator('#install').click();
    await expect(page.locator('#installHint')).toBeVisible();
    await expect(page.locator('#installHint')).toContainText('Zum Home-Bildschirm');
    await page.locator('#installHint [data-part="done"]').click();
    await expect(page.locator('#installHint')).toBeHidden();
  } else {
    // Ohne Netz startet das Spiel aus dem Zwischenspeicher des Service Workers.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.print')).toHaveCount(PRINTS);
    await page.locator('.print').first().click();
    await expect(page.locator('#board')).toBeVisible();
    await context.setOffline(false);
  }
  expect(errors).toEqual([]);
});

test('Impressum und Datenschutz sind von der Startseite aus erreichbar', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  const legal = page.locator('#legal a');
  await expect(legal).toHaveText(['Impressum', 'Datenschutz']);
  await legal.nth(0).click();
  await expect(page.locator('h1')).toHaveText('Impressum');
  await expect(page.locator('address')).toContainText('35606 Solms');
  await page.locator('.foot a').click();
  await expect(page.locator('h1')).toHaveText('Datenschutz');
  await expect(page.locator('main')).toContainText('erhebt keine Daten');
  // zurück ins Spiel
  await page.locator('.back').click();
  await expect(page.locator('#shelf')).toBeVisible();
  expect(errors).toEqual([]);
});

test('In der eingebetteten Einzeldatei fehlen die Verweise auf Nachbarseiten', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.body.innerHTML = '<iframe src="artifact.html" style="width:900px;height:700px;border:0"></iframe>';
  });
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('#shelf')).toBeVisible();
  await expect(frame.locator('#legal')).toBeHidden();
});

test('Die Seite bringt ein Symbol für den Browser-Tab mit', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('link[rel="icon"]')
    .evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));
  expect(hrefs.length).toBe(2);
  for (const href of hrefs) expect((await request.get(href)).status()).toBe(200);
});

// ---------- Sprachen ----------

test.describe('auf einem französischen Gerät', () => {
  test.use({ locale: 'fr-FR' });

  test('spricht das Spiel Französisch', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('.lede')).toContainText('Sans points, sans hâte.');
    await expect(page.locator('.print').first()).toContainText('Lune sur le lac');
    await expect(page.locator('.print.own')).toContainText('Choisir une photo');
    await expect(page.locator('#homeSettings')).toHaveText('Réglages');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /billes de verre/);
    // Der Name des Spiels bleibt in jeder Sprache derselbe.
    await expect(page).toHaveTitle('Murmel');
    await expect(page.locator('.wordmark')).toContainText('murmel');

    await page.locator('#homeSettings').click();
    await expect(page.locator('#settingsTitle')).toHaveText('Réglages');
    await expect(page.locator('#settings [data-part="holes"] .choice')).toHaveText(['Coupelle', 'Croix', 'Anneau']);
    const languages = page.locator('#settings [data-part="language"] .choice');
    await expect(languages).toHaveText(['Automatique', 'English', 'Deutsch', 'Italiano', 'Français', 'Español']);
    await expect(languages.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#settings [data-part="done"]').click();

    await page.evaluate(() => window.murmel.open('mond'));
    await expect(page.locator('#whisper')).toHaveText('Touche une bille.');
    await expect(page.locator('#back')).toHaveText('Collection');
    await expect(page.locator('#undo')).toHaveAttribute('aria-label', 'Annuler le coup');
    await page.evaluate(() => window.murmel.solve());
    await expect(page.locator('#finish')).toContainText('L’image est terminée.', { timeout: 15000 });
    expect(errors).toEqual([]);
  });
});

test.describe('auf einem Gerät, dessen Sprache das Spiel nicht spricht', () => {
  test.use({ locale: 'ja-JP' });

  test('spricht das Spiel Englisch', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.lede')).toContainText('No points, no hurry.');
    await expect(page.locator('.print').first()).toContainText('Moon over the Lake');
    await expect(page.locator('#homeSettings')).toHaveText('Settings');
  });
});

test('Die Sprache lässt sich in den Einstellungen umschalten, gilt sofort und bleibt nach dem Neuladen', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.evaluate(() => window.murmel.open('mond'));
  await page.locator('#playSettings').click();
  const languages = page.locator('#settings [data-part="language"] .choice');
  await expect(languages).toHaveText(['Automatisch', 'English', 'Deutsch', 'Italiano', 'Français', 'Español']);
  await expect(languages.nth(0)).toHaveAttribute('aria-pressed', 'true');

  // mitten im Spiel: Alles Beschriftete wechselt, das Spiel läuft weiter
  const before = await status(page);
  await languages.filter({ hasText: 'Italiano' }).click();
  await expect(languages.nth(3)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.locator('#settingsTitle')).toHaveText('Impostazioni');
  await expect(languages.nth(0)).toHaveText('Automatica');
  await expect(page.locator('#settings [data-part="sound"] .choice')).toHaveText(['Tutto', 'Solo biglie', 'Silenzio']);
  await expect(page.locator('#settings [data-part="tempo"]')).toHaveAttribute('aria-valuetext', 'normale');
  await page.locator('#settings [data-part="done"]').click();
  await expect(page.locator('#back')).toHaveText('Collezione');
  await expect(page.locator('#sound')).toHaveAttribute('aria-label', 'Suono attivo. Tocca per cambiare.');
  expect((await status(page))?.remaining).toBe(before?.remaining);

  await page.evaluate(() => window.murmel.home());
  await expect(page.locator('.print').first()).toContainText('Luna sul lago');
  await expect(page.locator('.print.own')).toContainText('Scegli una foto');

  // die Wahl bleibt nach dem Neuladen
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.locator('.print').first()).toContainText('Luna sul lago');
  await expect(page.locator('#homeSettings')).toHaveText('Impostazioni');

  // "Automatisch" folgt wieder dem Gerät
  await page.locator('#homeSettings').click();
  await expect(languages.nth(3)).toHaveAttribute('aria-pressed', 'true');
  await languages.nth(0).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#settingsTitle')).toHaveText('Einstellungen');
  await page.locator('#settings [data-part="done"]').click();
  await expect(page.locator('.print').first()).toContainText('Mond über dem See');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  expect(errors).toEqual([]);
});

// Ein Test je Sprache: Zusammen bräuchten sie auf dem Build-Server länger, als ein einzelner Test laufen darf.
for (const language of ['en', 'de', 'it', 'fr', 'es']) {
  test(`${language}: Der Name jedes Bildes passt in eine Zeile und das Einstellungsblatt auf den Schirm`, async ({
    page,
  }) => {
    // die Sprache steht schon im Speicher, bevor die Seite startet
    await page.addInitScript((language) => {
      localStorage.setItem('murmel.v1', JSON.stringify({ language }));
    }, language);
    for (const size of [
      { width: 834, height: 1194 },
      { width: 1194, height: 834 },
    ]) {
      const where = `${language}, ${size.width} × ${size.height}`;
      await page.setViewportSize(size);
      await page.goto('/');
      await expect(page.locator('html'), where).toHaveAttribute('lang', language);
      await expect(page.locator('.print')).toHaveCount(PRINTS);
      const wrapped = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.querySelectorAll('.print .print-name')]
          .filter((name) => {
            const range = document.createRange();
            range.selectNodeContents(name);
            return range.getClientRects().length > 1;
          })
          .map((name) => name.textContent);
      });
      expect(wrapped, where).toEqual([]);
      // Längere Wörter dürfen weder die Startseite noch das Einstellungsblatt in die Breite treiben.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), where).toBe(true);
      await page.locator('#homeSettings').click();
      const sheet = page.locator('#settings .sheet-body');
      expect(await sheet.evaluate((el) => el.scrollWidth <= el.clientWidth), where).toBe(true);
    }
  });
}
