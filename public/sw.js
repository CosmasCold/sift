// public/sw.js
const CACHE_NAME = 'sift-v1';
const STATIC_ASSETS = [
  '/',
  '/library',
  '/queue',
  '/feeds',
  '/explore',
  '/trending',
  '/discover',
  '/collections',
  '/settings',
  '/following',
  '/manifest.json',
  '/favicon.png',
  '/og-image.png',
  '/reading-bg.png',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, cloned);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    // Static assets: cache first, fallback to network
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
  }
});