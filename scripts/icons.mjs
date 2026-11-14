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

// iOS-App (siehe ios/): das Icon in 1024 und ein Startbild, das zum Himmel der Startseite passt.
const assets = 'ios/App/App/Assets.xcassets';
{
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:1024px;height:1024px}</style>${svg}`);
  await page.screenshot({ path: `${assets}/AppIcon.appiconset/AppIcon-512@2x.png` });
  await page.close();
  console.log(`${assets}/AppIcon.appiconset/AppIcon-512@2x.png`);
}
{
  // Das Startbild wird auf jedem Gerät mittig beschnitten: Der Himmel füllt alles, die Murmel sitzt klein in der Mitte.
  const side = 2732;
  const page = await browser.newPage({ viewport: { width: side, height: side } });
  await page.setContent(`<style>
    html,body{margin:0;height:100%}
    body{display:grid;place-items:center;background:linear-gradient(#1a2452,#56508f)}
    svg{width:520px;height:520px;clip-path:circle(29.3%)}
  </style>${svg}`);
  for (const file of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await page.screenshot({ path: `${assets}/Splash.imageset/${file}` });
    console.log(`${assets}/Splash.imageset/${file}`);
  }
  await page.close();
}
await browser.close();
