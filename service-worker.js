/**
 * SW minimaliste : ne met en cache QUE offline.html.
 * - HTML -> network-first (no-store), fallback offline.html si hors-ligne/erreur
 * - Pas de cache d’assets (images, css, js) => seul offline.html est conservé
 * - À l’activation, supprime tous les anciens caches
 * - Messages:
 *    • SKIP_WAITING
 *    • PURGE_ALL  (vide tous les caches puis réchauffe offline.html)
 */
const VERSION = 'v1-offline-only';
const SCOPE_PATH = new URL(self.registration.scope).pathname; // ex: "/Site-ETU/"
const STATIC_CACHE = `offline-only-${VERSION}`;
const OFFLINE_URL  = `${SCOPE_PATH}offline.html`;

// INSTALL: pré-cache uniquement offline.html
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    await self.skipWaiting();
  })());
});

// ACTIVATE: supprime tous les vieux caches puis prend le contrôle
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map(n => (keep.has(n) ? null : caches.delete(n))));
    await self.clients.claim();
  })());
});

// FETCH: documents = réseau d’abord, sinon offline.html ; le reste = réseau direct
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || request.destination === 'document';

  if (isDocument) {
    event.respondWith((async () => {
      try {
        // Tente le réseau en priorité (et évite tout cache HTTP)
        const preload = await event.preloadResponse;
        return preload || await fetch(request, { cache: 'no-store' });
      } catch {
        // Fallback strict: offline.html uniquement si échec réseau
        const cached = await caches.match(OFFLINE_URL);
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })());
    return;
  }

  // Pour tout le reste (assets…), ne rien mettre en cache → réseau direct
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      // Pas de fallback assets (on n’a que offline.html)
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});

// MESSAGES : SKIP_WAITING + purge totale à la demande du front
self.addEventListener('message', async (event) => {
  const type = event.data && event.data.type;

  if (type === 'SKIP_WAITING') {
    await self.skipWaiting();
    return;
  }

  if (type === 'PURGE_ALL') {
    const names = await caches.keys();
    await Promise.all(names.map(n => caches.delete(n)));
    const sc = await caches.open(STATIC_CACHE);
    await sc.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    event.ports?.[0]?.postMessage({ ok: true });
  }
});
