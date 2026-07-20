// Kaleidorium Service Worker
// Cache name bump forces the browser to install the new SW and clear old caches

const CACHE_NAME = 'kaleidorium-v10';
const STATIC_ASSETS = [
  '/manifest.json',
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

// Fetch: network-only for logos/icons so brand assets never stick in SW cache.
// Everything else that isn't a navigation stays network-only too.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Always go to network for navigations (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/').then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Logos/icons/favicons: always network — never cache-first
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/logos/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/site.webmanifest' ||
    url.pathname === '/sw.js'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Everything else: network only
  event.respondWith(
    fetch(event.request).catch(() => new Response('Offline', { status: 503 }))
  );
});
