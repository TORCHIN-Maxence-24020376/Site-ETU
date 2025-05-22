/**
 * service-worker.js
 * Service Worker pour la mise en cache et le support hors ligne
 */

// Nom et version du cache
const CACHE_NAME = 'site-etu-cache-v2';

// Liste des ressources à mettre en cache (réduite)
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/edt.html',
  '/today.html',
  '/CSS/style.css',
  '/CSS/clair.css',
  '/CSS/sombre.css',
  '/CSS/AMOLED.css',
  '/CSS/calendar.css',
  '/JAVASCRIPT/main.js',
  '/JAVASCRIPT/calendar.js',
  '/JAVASCRIPT/today.js',
  '/IMAGES/logo.svg',
  '/offline.html',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

// Stratégie de cache : Cache first, then network, avec fallback sur offline.html
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes provenant d'autres origines
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Ignorer les requêtes vers l'API météo ou d'autres API externes
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse depuis le cache
        if (response) {
          return response;
        }
        
        // Pas de correspondance dans le cache, récupérer depuis le réseau
        return fetch(event.request)
          .then((response) => {
            // S'assurer que la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cloner la réponse car elle ne peut être utilisée qu'une fois
            const responseToCache = response.clone();
            
            // Ajouter la réponse au cache pour les futures requêtes
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // Si la requête échoue (offline), servir une page hors ligne
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        
        // Pour les ressources images, servir une image de remplacement
        if (event.request.destination === 'image') {
          return caches.match('/IMAGES/offline-image.svg');
        }
        
        // Pour les autres ressources, échouer silencieusement
        return new Response('Contenu non disponible hors ligne', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Traitement des messages envoyés au Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 