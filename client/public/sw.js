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
        }
    );
  }
});

// Push Notifications Listener for Incoming Messages & WhatsApp-Like Calls
self.addEventListener('push', (event) => {
  let data = { title: 'Our Universe ❤️', body: 'New notification received!' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (_) {}

  const isCall = data.type === 'INCOMING_CALL' || (data.title && data.title.includes('Incoming Call'));
  
  const options = {
    body: data.body || (isCall ? 'Incoming call from partner...' : 'New love message received!'),
    icon: data.callerPhoto || '/heart.svg',
    badge: '/heart.svg',
    vibrate: isCall ? [500, 200, 500, 200, 500, 200, 500] : [200, 100, 200],
    tag: isCall ? 'incoming_call' : 'message',
    renotify: true,
    requireInteraction: isCall,
    data: { url: '/', isCall },
    actions: isCall ? [
      { action: 'accept_call', title: '📞 Accept' },
      { action: 'decline_call', title: '❌ Decline' }
    ] : []
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Our Universe Calling ❤️', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (let client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
