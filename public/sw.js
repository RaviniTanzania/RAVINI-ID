// RAVINI - Service Worker with Mobile Push Notifications
const SW_VERSION = 'ravini-v2.1.0-vision2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== SW_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push notification received from backend
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'RAVINI',
        message: event.data.text()
      };
    }
  }

  const title = data.title || 'RAVINI';
  const body = data.message || data.body || 'Una taarifa mpya kwenye akaunti yako ya RAVINI.';
  const url = data.url || '/';

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.type || 'nmy-general',
    renotify: true,
    data: {
      url,
      timestamp: Date.now(),
      type: data.type
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Fungua' },
      { action: 'close', title: 'Funga' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Trigger system notification from active web client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    const options = {
      body: body || 'Una taarifa mpya kwenye akaunti yako ya RAVINI.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || `ravini_${Date.now()}`,
      renotify: true,
      vibrate: [0, 250, 250, 250],
      data: {
        url: url || '/',
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: 'Fungua' }
      ]
    };
    self.registration.showNotification(title || 'RAVINI', options);
  }
});

// Notification click handler - opens relevant screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
