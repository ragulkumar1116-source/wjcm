// ============================================================
//  SERVICE WORKER – caches the app shell for offline use
//  The actual DATA is handled by SyncEngine (localStorage queue)
// ============================================================

const CACHE_NAME = 'cym-v1';

const APP_SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './members.html',
  './member-profile.html',
  './collections.html',
  './reports.html',
  './settings.html',
  './css/style.css',
  './js/sync.js',
  './js/app.js',
  './js/layout.js',
  './firebase/firebase-config.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

// Install: pre-cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for Firebase, cache-first for app shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase requests: always network (let SyncEngine handle offline)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return; // fall through to network
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
