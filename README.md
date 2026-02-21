# Jarvis PWA

A Progressive Web App client for the [OpenClaw](https://github.com/asifrao25/openclaw) AI gateway. Presents as a mobile-first chat interface (with alerts and reports views) that stays connected to your local OpenClaw instance and delivers push notifications — even when backgrounded on iOS.

---

## Architecture

```
iPhone/Browser
     │  HTTPS + WSS
     ▼
Tailscale (optional, for remote access)
     │
     ▼
Relay Server  :18800   ←── this repo
     │  WebSocket
     ▼
OpenClaw Gateway  :18789  (separate project)
```

The relay server:
- Serves the built PWA as static files
- Proxies WebSocket connections between the PWA and the OpenClaw gateway
- Buffers events (2-hour window) so reconnecting clients catch up on missed messages
- Sends Web Push notifications for final chat messages when no live client is connected

---

## Prerequisites

- **Node.js** 18+ (`brew install node` on macOS)
- **OpenClaw gateway** running locally on `ws://127.0.0.1:18789`
- *(Optional)* **Tailscale** for remote/HTTPS access — required for PWA install and push notifications on iOS

---

## Installation

```bash
git clone https://github.com/asifrao25/jarvis-2.git
cd jarvis-2
npm install
```

---

## Configuration

All runtime config lives in `server/config.js`. The only value you should change is the gateway password — set it via environment variable rather than editing the file:

```bash
export GATEWAY_PASSWORD="your-openclaw-gateway-password"
```

The password must match what your OpenClaw gateway expects for client authentication.

VAPID keys (for push notifications) are auto-generated on first run and saved to `~/.openclaw/pwa-vapid-keys.json`. Push subscriptions are stored in `~/.openclaw/pwa-push-subscriptions.json`.

---

## Build & Run

### Development

```bash
# Terminal 1 — Vite dev server (hot reload, port 18801)
npm run dev

# Terminal 2 — Relay server (port 18800)
GATEWAY_PASSWORD="yourpassword" npm run server
```

The dev server proxies API calls through Vite; use `http://localhost:18801` in your browser.

### Production

```bash
npm run build
GATEWAY_PASSWORD="yourpassword" npm run server
```

The relay serves the built app at `http://localhost:18800` (and `/pwa/` for Tailscale path routing).

---

## macOS Auto-start (LaunchAgent)

A launchd plist is included to run the relay server automatically on login.

**1. Edit the plist to match your username and Node path:**

```bash
# Find your node path
which node

# Edit deploy/com.openclaw-pwa.relay.plist:
#   - Replace /Users/m4-mac with your home directory
#   - Replace /opt/homebrew/bin/node with your node path
#   - Add GATEWAY_PASSWORD to EnvironmentVariables
```

**2. Install and load:**

```bash
cp deploy/com.openclaw-pwa.relay.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.openclaw-pwa.relay.plist
```

**Logs:**
```
~/.openclaw/logs/pwa-relay.log
~/.openclaw/logs/pwa-relay.err.log
```

**Restart / unload:**
```bash
launchctl unload ~/Library/LaunchAgents/com.openclaw-pwa.relay.plist
launchctl load   ~/Library/LaunchAgents/com.openclaw-pwa.relay.plist
```

---

## Remote Access via Tailscale

Tailscale gives the relay a valid HTTPS URL — required for Service Workers and push notifications on iOS.

### 1. Install Tailscale

```bash
brew install tailscale
```

Or download from [tailscale.com/download](https://tailscale.com/download).

### 2. Authenticate

```bash
sudo tailscale up
```

### 3. Expose the relay

```bash
# Serve the relay server over HTTPS at /pwa on your Tailscale hostname
tailscale serve --bg --https=443 --set-path=/pwa 18800
```

Tailscale will print your machine's Tailscale hostname, e.g.:
```
https://your-machine-name.tail1234.ts.net/pwa/
```

### 4. Check status

```bash
tailscale serve status
```

### 5. Remove when done

```bash
tailscale serve --https=443 --set-path=/pwa off
```

> **Note:** The `--set-path=/pwa` flag strips the `/pwa` prefix before forwarding to the relay, but the relay also accepts both `/pwa/*` and `/*` paths, so either access pattern works.

---

## Installing as a PWA on iPhone

1. Open `https://your-machine-name.tail1234.ts.net/pwa/` in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Open the app from your Home Screen
4. Log in with your gateway password
5. Tap **Enable Notifications** in Settings when prompted, and allow when iOS asks

Push notifications will arrive even when the app is backgrounded.

---

## One-shot Setup Script

For the quick path (macOS + Tailscale already installed):

```bash
# Edit deploy/setup.sh first — update paths and your Tailscale hostname
chmod +x deploy/setup.sh
GATEWAY_PASSWORD="yourpassword" ./deploy/setup.sh
```

The script builds the PWA, installs the LaunchAgent, and configures Tailscale Serve.

---

## Health Check

```bash
curl http://localhost:18800/api/health
```

```json
{
  "status": "ok",
  "gateway": "connected",
  "pwaClients": 1,
  "buffer": { "totalEvents": 42 },
  "timestamp": "2026-02-21T00:00:00.000Z"
}
```

---

## Project Structure

```
.
├── src/                    # PWA source (Vite + Lit web components)
│   ├── index.html
│   ├── main.js
│   ├── components/         # app-shell, chat-view, alert-view, settings-view, …
│   └── services/           # ws-client, auth, push-registration, message-store
├── public/                 # Static assets (manifest, service worker, icons)
│   ├── sw.js
│   └── manifest.json
├── server/                 # Relay server (Node.js / Express / ws)
│   ├── index.js            # Main entry — HTTP + WebSocket server
│   ├── config.js           # Port, gateway URL, VAPID config
│   ├── gateway-client.js   # WebSocket client for OpenClaw gateway
│   ├── push-manager.js     # Web Push notifications
│   ├── event-buffer.js     # In-memory event replay buffer
│   └── category-filter.js  # Classifies events as chat/alert/report
├── deploy/
│   ├── setup.sh                        # One-shot setup script
│   └── com.openclaw-pwa.relay.plist    # macOS LaunchAgent
└── vite.config.js
```

---

## Troubleshooting

| Problem | Check |
|---|---|
| Gateway shows "disconnected" | Is OpenClaw gateway running on port 18789? |
| Push notifications not arriving | Did you install as PWA from Home Screen (not browser tab)? |
| iOS rejects Service Worker | You need HTTPS — use Tailscale |
| `tailscale serve` command not found | Run `sudo tailscale up` first; serve requires the daemon |
| LaunchAgent not starting | Check `~/.openclaw/logs/pwa-relay.err.log` |
| Password rejected | Ensure `GATEWAY_PASSWORD` env var matches OpenClaw gateway config |
