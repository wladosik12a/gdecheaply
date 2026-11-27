const CACHE = 'gdecheaply-react-v3';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['./', './app.webmanifest', './logo.png', './legacy.js'])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('gdecheaply-') && key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // The HTML contains the API address; legacy.js changes without a hashed filename.
  // Fetch these from the network without an HTTP-cache shortcut on every opening.
  const fresh = request.mode === 'navigate' || url.pathname.endsWith('/legacy.js');
  event.respondWith(fetch(request, fresh ? {cache:'no-store'} : {}).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
    return response;
  }).catch(() => caches.match(request).then(response => response || Response.error())));
});

