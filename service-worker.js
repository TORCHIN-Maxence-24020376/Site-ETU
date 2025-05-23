/**
 * service-worker.js
 * Service Worker pour la mise en cache et le support hors ligne
 */

// Chemin de base pour GitHub Pages
const BASE_PATH = '/Site-ETU/';

// Nom et version du cache
const CACHE_NAME = 'site-etu-cache-v3';
const STATIC_CACHE_NAME = 'site-etu-static-v3';
const DYNAMIC_CACHE_NAME = 'site-etu-dynamic-v3';

// Liste des ressources statiques essentielles à mettre en cache
const STATIC_RESOURCES = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'offline.html',
  BASE_PATH + 'CSS/style.css',
  BASE_PATH + 'CSS/clair.css',
  BASE_PATH + 'CSS/CLAIR/blanc.css',
  BASE_PATH + 'CSS/SOMBRE/aqua.css',
  BASE_PATH + 'CSS/AMOLED/AMOLED.css',
  BASE_PATH + 'JAVASCRIPT/main.js',
  BASE_PATH + 'manifest.json'
];

// Installation du Service Worker - Pré-cache des ressources essentielles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
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

// Stratégie de cache : Network first with cache fallback pour les pages de navigation
// Cache first pour les ressources statiques
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes provenant d'autres origines
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Ignorer les requêtes vers des API 
  if (event.request.url.includes('/api/')) return;
  
  const requestUrl = new URL(event.request.url);
  
  // Stratégie pour les pages HTML: Network first, fallback to cache, then offline
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre en cache une copie de la réponse
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match(BASE_PATH + 'offline.html');
            });
        })
    );
    return;
  }
  
  // Stratégie cache-first pour les ressources statiques (CSS, JS, images)
  if (
    event.request.destination === 'style' || 
    event.request.destination === 'script' || 
    event.request.destination === 'image' || 
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Ne mettre en cache que les réponses valides
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
              
              return response;
            })
            .catch(() => {
              // Retourner une ressource par défaut selon le type
              if (event.request.destination === 'image') {
                return caches.match(BASE_PATH + 'IMAGES/offline-image.svg');
              }
            });
        })
    );
    return;
  }
  
  // Stratégie par défaut: cache puis réseau
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Mise à jour en arrière-plan
          fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(DYNAMIC_CACHE_NAME)
                  .then(cache => cache.put(event.request, response));
              }
            })
            .catch(() => {/* ignore les erreurs */});
          
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
            
            return response;
          })
          .catch(() => {
            // Fallback
            if (event.request.destination === 'document') {
              return caches.match(BASE_PATH + 'offline.html');
            }
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