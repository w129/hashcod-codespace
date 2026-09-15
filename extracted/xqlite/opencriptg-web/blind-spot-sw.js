const BLIND_SPOT_CACHE = 'blind-spot-shell-v6';
const BLIND_SPOT_ASSETS = [
  '/blind-spot-shell.html',
  '/blindspot.html',
  '/vendor/qrcode.min.js?v=blind-spot-shell',
  '/vendor/qrcode.min.js',
  '/app/hashcod-platform-icon.svg?v=blind-spot-shell',
  '/app/hashcod-platform-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(BLIND_SPOT_CACHE)
      .then((cache) => cache.addAll(BLIND_SPOT_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('blind-spot-shell-') && key !== BLIND_SPOT_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const allowed = url.pathname === '/blind-spot-shell.html'
    || url.pathname === '/blindspot.html'
    || url.pathname === '/vendor/qrcode.min.js'
    || url.pathname === '/app/hashcod-platform-icon.svg';
  if (!allowed || event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(BLIND_SPOT_CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (url.pathname !== '/blind-spot-shell.html') return caches.match('/blind-spot-shell.html');
        return new Response('Blind spot shell offline cache unavailable. Open once with internet first.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/blind-spot-shell.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => client.url.includes('/blind-spot-shell.html'));
      if (existing) {
        await existing.focus();
        existing.postMessage({ type: 'blind-spot-notification-open', clipId: event.notification.data && event.notification.data.clipId });
        return;
      }
      await self.clients.openWindow(targetUrl);
    })
  );
});
