// Full registration: request permission + subscribe + send to server
export async function registerPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[Push] Permission denied');
    return false;
  }

  return _subscribe();
}

// Re-sync: if permission already granted, send existing subscription to server
// Returns true if subscription exists and was synced, false if user action needed
export async function resyncPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      const clientId = 'pwa-' + Date.now();
      await fetch('/pwa/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, subscription: existing.toJSON() }),
      });
      console.log('[Push] Re-synced existing subscription with server');
      return true;
    }
    console.log('[Push] No existing browser subscription, need user gesture');
    return false;
  } catch (err) {
    console.error('[Push] Re-sync failed:', err);
    return false;
  }
}

async function _subscribe() {
  try {
    const res = await fetch('/pwa/api/vapid-public-key');
    const { publicKey } = await res.json();

    const padding = '='.repeat((4 - publicKey.length % 4) % 4);
    const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const key = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) key[i] = rawData.charCodeAt(i);

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });

    const clientId = 'pwa-' + Date.now();
    await fetch('/pwa/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, subscription: subscription.toJSON() }),
    });

    console.log('[Push] Registered successfully');
    localStorage.setItem('openclaw-push-registered', 'true');
    return true;
  } catch (err) {
    console.error('[Push] Registration failed:', err);
    return false;
  }
}
