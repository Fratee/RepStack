// Service Worker for GymTimer Pro
const CACHE_NAME = 'gymtimer-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
  '/apple-touch-icon.png',
  '/icon.svg'
];

let activeTimerTimeout = null;

// Install event: cache initial assets & immediately skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
});

// Activate event: immediately clean old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: network first for HTML, never touch API calls
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NEVER intercept or cache API requests, Vite HMR, or dev imports
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('?import') ||
    url.pathname.includes('node_modules')
  ) {
    return;
  }

  // For navigation requests, try network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // For other requests, cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

// Handle messages from the app (e.g. Schedule rest timer notification)
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SCHEDULE_TIMER') {
    if (activeTimerTimeout) {
      clearTimeout(activeTimerTimeout);
      activeTimerTimeout = null;
    }

    const { targetTime, title, body, exerciseName } = data;
    const now = Date.now();
    const delay = Math.max(0, targetTime - now);

    activeTimerTimeout = setTimeout(async () => {
      try {
        await self.registration.showNotification(title || '⏰ Riposo Terminato!', {
          body: body || (exerciseName ? `È ora della prossima serie di ${exerciseName}!` : 'Pronto per la prossima serie! Vai!'),
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: 'gym-rest-timer',
          renotify: true,
          requireInteraction: true,
          silent: false,
          vibrate: [300, 100, 300, 100, 400],
          data: {
            url: '/',
            time: Date.now()
          },
          actions: [
            { action: 'open', title: 'Apri Scheda' },
            { action: 'done', title: 'Serie Completata' }
          ]
        });
      } catch (err) {
        console.error('Error showing notification from SW:', err);
      }
    }, delay);
  }

  if (data.type === 'CANCEL_TIMER') {
    if (activeTimerTimeout) {
      clearTimeout(activeTimerTimeout);
      activeTimerTimeout = null;
    }
  }

  if (data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('⌚ Notifica Smartwatch Attiva', {
      body: 'Il timer vibra sul tuo orologio quando il riposo finisce!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'gym-test',
      renotify: true,
      vibrate: [200, 100, 200]
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

