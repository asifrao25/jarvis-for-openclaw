import fs from 'fs';
import path from 'path';
import webPush from 'web-push';

// Load .env from project root if present (values never override existing env vars)
try {
  const envPath = new URL('../.env', import.meta.url).pathname;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {}

const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');
const VAPID_KEYS_PATH = path.join(OPENCLAW_DIR, 'pwa-vapid-keys.json');
const SUBSCRIPTIONS_PATH = path.join(OPENCLAW_DIR, 'pwa-push-subscriptions.json');

// Load or generate VAPID keys
function loadVapidKeys() {
  try {
    if (fs.existsSync(VAPID_KEYS_PATH)) {
      return JSON.parse(fs.readFileSync(VAPID_KEYS_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('[Config] Failed to load VAPID keys:', err.message);
  }

  console.log('[Config] Generating new VAPID keys...');
  const keys = webPush.generateVAPIDKeys();
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
  fs.writeFileSync(VAPID_KEYS_PATH, JSON.stringify(keys, null, 2));
  console.log('[Config] VAPID keys saved to', VAPID_KEYS_PATH);
  return keys;
}

const vapidKeys = loadVapidKeys();

export default {
  port: 18800,
  gatewayUrl: 'ws://127.0.0.1:18789',
  gatewayPassword: process.env.GATEWAY_PASSWORD,

  // Event buffer
  maxEvents: 500,
  maxAgeMs: 2 * 60 * 60 * 1000, // 2 hours
  rateLimitWindowMs: 60000,
  maxReplayPerMinute: 10,

  // VAPID
  vapidKeys,
  vapidSubject: process.env.VAPID_EMAIL,

  // File paths
  subscriptionsPath: SUBSCRIPTIONS_PATH,
  openclawDir: OPENCLAW_DIR,
};
