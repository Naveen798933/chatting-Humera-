const CACHE_NAME = 'our-universe-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/heart.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy to ensure Render always loads fresh app code
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh response
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
  }
});
