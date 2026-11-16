import { test } from '@playwright/test';

// Vorübergehende Prüfbilder für die visuelle Abnahme; werden vor der Übergabe wieder entfernt.
test('Prüfbilder von Rahmen und Rollbewegung im iPad-Format', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'Die Prüfbilder stammen aus dem iPad-Browser.');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.clock.install({ time: new Date('2026-11-16T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-16T12:00:01Z'));
  await page.goto('/');
  await page.evaluate(() => window.murmel.open('mond'));
  await page.clock.runFor(1200);
  const whole = await page.screenshot({ type: 'jpeg', quality: 65, scale: 'css' });
  console.log(`MURMEL_REVIEW_quer=${whole.toString('base64')}`);
  const group = await page.evaluate(() => window.murmel.group());
  const wood = await page.evaluate(() => window.murmel.wood());
  if (!group) throw new Error('Murmelgruppe fehlt');
  await page.mouse.click(group.x, group.y);
  await page.mouse.click(wood.x, wood.y);
  for (let frame = 0; frame < 12; frame++) {
    await page.clock.runFor(100);
    const image = await page.screenshot({
      type: 'jpeg',
      quality: 60,
      scale: 'css',
      clip: { x: 620, y: 100, width: 380, height: 560 },
    });
    console.log(`MURMEL_REVIEW_roll${frame}=${image.toString('base64')}`);
  }
  await page.clock.runFor(6000);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.clock.runFor(200);
  const upright = await page.screenshot({ type: 'jpeg', quality: 65, scale: 'css' });
  console.log(`MURMEL_REVIEW_hoch=${upright.toString('base64')}`);
});
