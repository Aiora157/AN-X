const CACHE_NAME = 'ancora-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  // Adicione outros arquivos JS que você usa
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});