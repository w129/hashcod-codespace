self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const note = event.notification.data || {};
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find((client) => client.url.includes('/phone-os.html'));
    if (existing) {
      existing.postMessage({ type: 'hashcod-open-note', note });
      await existing.focus();
      return;
    }
    const encoded = encodeURIComponent(JSON.stringify(note));
    await self.clients.openWindow(`/phone-os.html?open=${encodeURIComponent(encoded)}`);
  })());
});
