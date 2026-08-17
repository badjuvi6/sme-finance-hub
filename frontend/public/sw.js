const CACHE_NAME = 'sme-hub-v1';

// Static assets to pre-cache for offline capability and PWA install criteria
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install Event: Cache essential shell assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Fetch Event: Bypass API calls; handle web pages with Network-first fallback
self.addEventListener('fetch', (event) => {
  // Let network handle dynamic backend API calls directly
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first strategy with offline cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET requests dynamically
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request) || caches.match('/index.html'))
  );
});