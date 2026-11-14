// Erzeugt die App-Icons (PNG) aus public/icon.svg. Nur nötig, wenn sich das Icon ändert:
//   node scripts/icons.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/icon.svg', 'utf8');
const sizes = { 'icon-512.png': 512, 'icon-192.png': 192, 'icon-180.png': 180 };

const browser = await chromium.launch();
for (const [file, size] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: `public/${file}` });
  await page.close();
  console.log(`public/${file}`);
}
await browser.close();
