// Toda vez que mudar qualquer arquivo do app, aumente o número em CACHE (v1 → v2…) e
// atualize ASSETS.
const CACHE = 'bingo-vovo-v29';

const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './src/engine/cards.js',
  './src/engine/draw.js',
  './src/engine/extraBalls.js',
  './src/engine/patterns.js',
  './src/engine/payout.js',
  './src/engine/pyramids.js',
  './src/engine/rng.js',
  './src/format.js',
  './src/main.js',
  './src/nuvem/config.js',
  './src/nuvem/conta.js',
  './src/nuvem/mesclar.js',
  './src/nuvem/sincronia.js',
  './src/round.js',
  './src/state.js',
  './src/ui/ballboard.js',
  './src/ui/cards.js',
  './src/ui/conta.js',
  './src/ui/controls.js',
  './src/ui/modals.js',
  './src/ui/modes.js',
  './src/ui/pyramids.js',
  './src/ui/sound.js',
  './src/ui/topbar.js',
  './src/ui/wakelock.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
    ),
  );
});
