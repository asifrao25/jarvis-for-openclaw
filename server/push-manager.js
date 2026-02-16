import fs from 'fs';
import webPush from 'web-push';
import config from './config.js';

export default class PushManager {
  constructor() {
    this.subscriptions = new Map();
    this._loadSubscriptions();

    webPush.setVapidDetails(
      config.vapidSubject,
      config.vapidKeys.publicKey,
      config.vapidKeys.privateKey
    );
  }

  registerSubscription(clientId, subscription) {
    // Remove any existing subscriptions with the same endpoint (same browser/device)
    for (const [existingId, existingSub] of this.subscriptions) {
      if (existingSub.endpoint === subscription.endpoint) {
        this.subscriptions.delete(existingId);
      }
    }
    this.subscriptions.set(clientId, {
      ...subscription,
      registeredAt: new Date().toISOString(),
    });
    this._saveSubscriptions();
    console.log('[Push] Registered subscription for', clientId, `(${this.subscriptions.size} total)`);
  }

  async sendToAll(notification) {
    const entries = Array.from(this.subscriptions.entries());
    if (entries.length === 0) return;

    console.log('[Push] Sending to', entries.length, 'subscriptions');
    const payload = JSON.stringify(notification);

    for (const [clientId, sub] of entries) {
      try {
        await webPush.sendNotification(sub, payload);
        console.log('[Push] Sent to', clientId);
      } catch (err) {
        console.error(`[Push] Failed for ${clientId}: status=${err.statusCode}, ${err.message}`, err.body || '');
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('[Push] Subscription gone, removing', clientId);
          this.subscriptions.delete(clientId);
          this._saveSubscriptions();
        }
      }
    }
  }

  getPublicKey() {
    return config.vapidKeys.publicKey;
  }

  _loadSubscriptions() {
    try {
      if (fs.existsSync(config.subscriptionsPath)) {
        const data = JSON.parse(fs.readFileSync(config.subscriptionsPath, 'utf-8'));
        this.subscriptions = new Map(Object.entries(data));
        console.log('[Push] Loaded', this.subscriptions.size, 'subscriptions');
      }
    } catch (err) {
      console.error('[Push] Failed to load subscriptions:', err.message);
    }
  }

  _saveSubscriptions() {
    try {
      const obj = Object.fromEntries(this.subscriptions);
      fs.writeFileSync(config.subscriptionsPath, JSON.stringify(obj, null, 2));
    } catch (err) {
      console.error('[Push] Failed to save subscriptions:', err.message);
    }
  }
}
