// GF Dashboard — Service Worker (PWA)
const CACHE_NAME = 'gf-dash-v2';
const STATIC_ASSETS = [
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png',
  '/manifest.json'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for everything, cache only icons/manifest
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only cache icons and manifest — everything else goes to network
  if (url.pathname.startsWith('/assets/img/icon-') || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Everything else: network only (no cache interference)
  // This prevents stale JS/CSS/HTML from being served
});
