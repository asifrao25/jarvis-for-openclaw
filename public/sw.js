// Service Worker for Jarvis PWA

const CACHE_NAME = 'openclaw-pwa-v148';
const SHELL_FILES = ['/pwa/', '/pwa/index.html'];

// Badge count tracker (simple in-memory, but will try to persist via Cache API for resilience)
let badgeCount = 0;

async function getStoredBadgeCount() {
  try {
    const cache = await caches.open('badge-store');
    const resp = await cache.match('count');
    if (resp) return parseInt(await resp.text(), 10) || 0;
  } catch (e) {}
  return 0;
}

async function setStoredBadgeCount(count) {
  try {
    const cache = await caches.open('badge-store');
    await cache.put('count', new Response(count.toString()));
  } catch (e) {}
}

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== 'badge-store').map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/WS, cache-first for shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/pwa/api/') || url.pathname.startsWith('/pwa/ws')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// Push notification — only show if PWA is not visible in foreground
self.addEventListener('push', (event) => {
  let data = { title: 'Jarvis', body: 'New message' };
  try {
    data = event.data.json();
  } catch {}

  const tag = data.category || 'chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const hasForeground = clients.some(c => c.visibilityState === 'visible' || c.focused);
      
      // Update badge count regardless of visibility (some platforms only show badge if notification is shown, others always)
      badgeCount = await getStoredBadgeCount();
      badgeCount++;
      await setStoredBadgeCount(badgeCount);

      if (self.navigator && self.navigator.setAppBadge) {
        try { await self.navigator.setAppBadge(badgeCount); } catch (e) {
          console.log('[SW] setAppBadge failed:', e);
        }
      }

      if (hasForeground) return;

      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/pwa/icons/icon-192.png',
        badge: '/pwa/icons/icon-192.png',
        tag,
        data: { url: data.url || '/pwa/' },
        vibrate: [100, 50, 100],
      });
    })
  );
});

// Notification click — clear badge and focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/pwa/';

  event.waitUntil(
    (async () => {
      // Clear badge
      badgeCount = 0;
      await setStoredBadgeCount(0);
      if (self.navigator && self.navigator.clearAppBadge) {
        try { await self.navigator.clearAppBadge(); } catch {}
      }

      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        if (client.url.includes('/pwa/') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })()
  );
});

// Clear badge message handler
self.addEventListener('message', (event) => {
  if (event.data === 'clear-badge') {
    badgeCount = 0;
    setStoredBadgeCount(0);
    if (self.navigator && self.navigator.clearAppBadge) {
      self.navigator.clearAppBadge().catch(() => {});
    }
  }
});

// Subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then(sub => {
      return fetch('/pwa/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'pwa-resubscribe-' + Date.now(),
          subscription: sub.toJSON(),
        }),
      });
    })
  );
});
