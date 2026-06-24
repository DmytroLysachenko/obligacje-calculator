const CACHE_NAME = 'bond-calculator-static-v2';
const STATIC_ASSETS = ['/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigationRequest =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    event.request.headers.get('accept')?.includes('text/html');

  if (!isSameOrigin) {
    return;
  }

  // Always prefer fresh HTML so route UI cannot drift across deployments.
  if (isNavigationRequest) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
  }
});
