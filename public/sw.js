// Service Worker: Murmel läuft auch ohne Netz, sobald die Seite einmal geladen war.
//
// Netz zuerst, Zwischenspeicher als Rückfall: Wer online ist, bekommt immer den neuesten Stand. Ohne Netz liefert
// der Zwischenspeicher die zuletzt geladene Fassung. Skript, Styles und Schriften stecken im HTML (siehe
// vite.config.ts), deshalb genügen die wenigen Dateien unten für ein vollständiges Spiel.
const CACHE = 'murmel-v1';
const FILES = [
  './',
  'impressum.html',
  'datenschutz.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          // Jede Seite der App ist dieselbe Datei: unter './' ablegen, egal ob mit index.html oder Suchanhang.
          const key = request.mode === 'navigate' ? './' : request;
          void caches.open(CACHE).then((cache) => cache.put(key, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request.mode === 'navigate' ? './' : request, { ignoreSearch: true });
        return cached ?? Response.error();
      }),
  );
});
