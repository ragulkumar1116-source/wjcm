/**
 * sw.js - Service Worker
 * Church Youth Collection Manager
 * Handles offline caching and background sync
 */

const CACHE_NAME = 'cycm-v1.0.0';
const OFFLINE_CACHE = 'cycm-offline-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/members.js',
  '/js/collections.js',
  '/js/reports.js',
  '/firebase/firebase-config.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'
];

// ============================================================
// INSTALL: Cache all static assets
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { mode: 'no-cors' });
      })).catch(e => {
        console.warn('[SW] Some assets failed to cache:', e);
      });
    })
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE: Clean up old caches
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ============================================================
// FETCH: Cache-first for static, network-first for API
// ============================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Firebase API calls - Network only
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') && !url.pathname.includes('fonts')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For navigation requests - Network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful navigation responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // For static assets - Cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request.clone()).then((response) => {
        // Only cache valid responses
        if (!response || response.status !== 200) return response;

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Return a basic offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ============================================================
// BACKGROUND SYNC (if supported)
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-collections') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // Notify clients to process sync queue
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_REQUESTED' });
        });
      })
    );
  }
});

// ============================================================
// MESSAGE HANDLER
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker loaded - Church Youth Collection Manager v1.0.0');
