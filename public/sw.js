// Kaleidorium Service Worker
// Cache name bump forces the browser to install the new SW and clear old caches

const CACHE_NAME = 'kaleidorium-v6';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logos/kaleidorium-icon-192.png',
  '/logos/kaleidorium-icon-512.png',
  '/logos/kaleidorium-wordmark.png',
  '/logos/kaleidorium-icon-180.png',
];

// Install: cache core assets then activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('SW: failed to pre-cache', url, err);
          })
        )
      );
    })
  );
  // Skip waiting so the new SW activates without requiring a tab close
  self.skipWaiting();
});

// Activate: delete old caches then claim all open clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('SW: deleting old cache', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim()) // claim AFTER old caches are gone
  );
});

// Fetch: network-first for HTML/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Always go to network for navigations (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/').then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Cache-first for icons and static logo assets (no query params)
  const isStaticAsset =
    (url.pathname.startsWith('/logos/') || url.pathname.startsWith('/icons/')) &&
    url.search === '';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network only
  event.respondWith(
    fetch(event.request).catch(() => new Response('Offline', { status: 503 }))
  );
});
