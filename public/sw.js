// Simple service worker for PWA installation
// This is required for PWA installation to work on some browsers

const CACHE_NAME = 'kaleidorium-v1';
const urlsToCache = [
  '/',
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If fetch fails, return a basic response instead of crashing
          return new Response('Network error', { 
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
      .catch(() => {
        // Fallback to network if cache match fails
        return fetch(event.request).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

