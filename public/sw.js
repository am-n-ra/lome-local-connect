// Omni PWA — Phase C (HO-OMNI-29) : shell installable + dégradé honnête.
// - Navigation : réseau d'abord, repli `/offline.html` (jamais une page blanche).
// - `/assets/*` hashés : cache-first + peuplement (le précachage ne peut pas
//   connaître les hashes au moment de l'install).
// - `/api/*` : réseau seul, SANS repli — une API hors-ligne échoue honnêtement
//   (le client affiche ses états d'erreur), jamais du HTML 200 déguisé.
// - Le reste same-origin : réseau d'abord, repli cache, repli `/`.
const CACHE_NAME = 'omni-shell-v3';
const APP_SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/omni-logo-compact.png', '/pwa-icon-192.png', '/pwa-icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME && key.startsWith('omni-shell-')).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const pathname = new URL(event.request.url).pathname;
  if (pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html').then((offline) => offline || caches.match('/'))),
    );
    return;
  }
  if (pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('/offline.html'))),
    );
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))),
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Omni', body: 'Une mise à jour est disponible.', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/omni-logo-compact.png',
    badge: '/omni-logo-compact.png',
    data: { url: payload.url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => 'focus' in client);
    if (existing) {
      existing.navigate(url);
      return existing.focus();
    }
    return self.clients.openWindow(url);
  }));
});
