// Simple service worker for PWA installation
// This is required for PWA installation to work on some browsers
// Using minimal caching to avoid performance issues

const CACHE_NAME = 'kaleidorium-v2';
const urlsToCache = [
  '/manifest.json',
  '/logos/pwa-icon-192x192.svg',
  '/logos/pwa-icon-512x512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Use addAll but don't fail if some files don't exist
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('Service Worker: Failed to cache', url, err);
              return null; // Don't fail the whole install
            })
          )
        );
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed (non-critical)', error);
        // Don't fail installation if caching fails
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Fetch event - network first strategy for better performance
// Only cache specific static assets, not dynamic content
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Only cache static assets (images, icons, fonts)
  const shouldCache = url.pathname.startsWith('/logos/') || 
                      url.pathname.startsWith('/_next/static/') ||
                      url.pathname.endsWith('.svg') ||
                      url.pathname.endsWith('.png') ||
                      url.pathname.endsWith('.jpg') ||
                      url.pathname.endsWith('.webp');
  
  if (shouldCache) {
    // Cache static assets - try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.ok) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          }).catch(() => {
            return new Response('Network error', { 
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
  } else {
    // For dynamic content, always use network first (no caching)
    event.respondWith(fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503 });
    }));
  }
});

